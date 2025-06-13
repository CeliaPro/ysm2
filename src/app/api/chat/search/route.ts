export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { openai as aiProvider } from "@ai-sdk/openai";
import { getContextFromQuery } from "@/lib/astra/search";
import { addMessageToConversation } from "@/lib/actions/conversations/conversation";
import { getUserFromRequest } from "@/app/utils/auth.utils"; // Your custom user getter

export async function POST(req: NextRequest) {
  try {
    // --- AUTHENTICATION ---
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // --- REQUEST DATA ---
    const { messages, conversationId } = await req.json();

    console.log('Request details:', {
      userId: user.id,
      conversationId,
      messageCount: messages?.length,
      environment: process.env.NODE_ENV,
      database: process.env.MONGODB_URI?.substring(0, 20) + '...',
    });

    // --- VALIDATION ---
    if (!user?.id || !conversationId) {
      return NextResponse.json(
        { success: false, error: "Utilisateur ou conversationId manquant" },
        { status: 400 }
      );
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun message fourni" },
        { status: 400 }
      );
    }

    // --- CONTEXT ---
    const lastUserMsg = messages.filter((m) => m.role === "USER").slice(-1)[0];
    const query = lastUserMsg?.content ?? "";

    let docContext = "";
    const contextMetadata = {
      hasContext: false,
      documentCount: 0,
      sources: [] as string[],
      pages: [] as number[],
      sections: [] as string[],
    };

    try {
      console.log(`🔍 Recherche vectorielle pour: "${query}"`);
      docContext = await getContextFromQuery(query, conversationId);

      if (docContext && docContext !== "No relevant context found.") {
        contextMetadata.hasContext = true;

        // Extract metadata (document count, sources, pages, sections)
        const documentMatches = docContext.match(/Document \d+:/g);
        contextMetadata.documentCount = documentMatches?.length || 0;

        const sourceMatches = docContext.match(/Source: ([^\n]+)/g);
        contextMetadata.sources =
          sourceMatches?.map((match) =>
            match.replace("• Source: ", "").trim()
          ) || [];

        const pageMatches = docContext.match(/Page: (\d+)/g);
        contextMetadata.pages =
          pageMatches
            ?.map((match) => parseInt(match.replace("• Page: ", "")))
            .filter((page) => !isNaN(page)) || [];

        const sectionMatches = docContext.match(/Sections: ([^\n]+)/g);
        contextMetadata.sections =
          sectionMatches?.flatMap((match) =>
            match.replace("• Sections: ", "").split(", ")
          ) || [];

        console.log("📊 Contexte trouvé:", contextMetadata);
      }
    } catch (searchError) {
      console.error("❌ La recherche vectorielle a échoué:", searchError);
      // Continue with empty context if search fails
    }

    // --- SYSTEM PROMPT ---
    const systemPrompt = {
      role: "system",
      content: `
**Rôle de l'assistant** :
Tu es un assistant intelligent expert en BIM, électricité, installations techniques, réglementation et projets de construction. Tu aides les utilisateurs à comprendre ou exploiter des documents techniques.

---

**Contexte documentaire** :

${
  contextMetadata.hasContext
    ? `
### CONTEXTE DISPONIBLE (obtenu par recherche vectorielle)
- **Documents pertinents** : ${contextMetadata.documentCount}
- **Sources** : ${contextMetadata.sources.join(", ") || "Aucune"}
- **Pages** : ${contextMetadata.pages.join(", ") || "Non précisées"}
- **Sections** : ${contextMetadata.sections.join(", ") || "Non précisées"}

\`\`\`
${docContext}
\`\`\`

**IMPORTANT :**
- Tu dois toujours utiliser prioritairement les informations ci-dessus.
- Si tu cites une information issue du contexte, indique la source :
  \`[Document: nom.pdf, Page: X, Section: Y]\`
`
    : `
### PAS DE CONTEXTE DISPONIBLE
Utilise tes connaissances générales dans le domaine AEC (électricité, BIM, normes, etc.)
`
}

---

**Règles à suivre pour ta réponse** :

1. **Structure Markdown claire**
  - Utilise des titres "###" pour séparer les parties
  - Si nécessaire, commence par un résumé clair (2-3 lignes)

2. **Style d’écriture**
  - Langage professionnel et technique
  - Phrase courte, claire, sans redondance
  - Ne commence jamais par "En tant qu'assistant..." ni "D'après mes connaissances..."

3. **Utilisation des sources**
  - Cite toujours les documents si tu utilises des extraits du contexte
  - Format obligatoire : \`[Document: nom.pdf, Page: X, Section: Y]\`

4. **Exemples de structure attendue** :
  \`\`\`markdown
  ### Objectif
  Décrire le rôle ou le but du composant...

  ### Exigences techniques
  - Matériau : PVC rigide
  - Conformité : Norme NF C 15-100

  ### Méthode d’installation
  Prévoir une pente minimale pour l’écoulement des condensats…

  [Document: plans-electricite.pdf, Page: 12, Section: 3.1.8.2]
  \`\`\`

5. **Si l'utilisateur demande une explication ou un résumé**
  - Sois synthétique mais structuré
  - Si la section est longue, segmente-la par sous-parties
  

---

**Requête actuelle de l’utilisateur :**
"${query}"

---
Réponds maintenant selon toutes les instructions ci-dessus.
`,
    };

    // --- SAVE USER MESSAGE ---
    try {
      await addMessageToConversation({
        content: query,
        role: "USER",
        conversationId,
        userId: user.id,
        metadata: {
          timestamp: Date.now(),
          environment: process.env.NODE_ENV,
          searchMetadata: contextMetadata,
        },
      });
      console.log("✅ Message utilisateur sauvegardé");
    } catch (saveError) {
      console.error("❌ Échec de sauvegarde du message utilisateur:", {
        error: saveError,
        userId: user.id,
        conversationId,
        stack: saveError instanceof Error ? saveError.stack : undefined,
      });
    }

    // --- STREAM ASSISTANT RESPONSE ---
    const stream = await streamText({
      model: aiProvider("gpt-4o-mini"),
      messages: [
        systemPrompt,
        ...messages.map((m) => ({
          role: m.role.toLowerCase(),
          content: m.content,
        })),
      ],
      temperature: 0.3,
      maxTokens: 2000,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.textStream) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          // Save assistant message after stream completes
          try {
            await addMessageToConversation({
              content: fullResponse,
              role: "ASSISTANT",
              conversationId,
              userId: user.id,
              metadata: {
                timestamp: Date.now(),
                contextMetadata,
                responseLength: fullResponse.length,
                environment: process.env.NODE_ENV,
              },
            });
            console.log("✅ Réponse de l'assistant sauvegardée");
          } catch (saveError) {
            console.error("❌ Échec de sauvegarde de la réponse:", {
              error: saveError,
              userId: user.id,
              conversationId,
              stack: saveError instanceof Error ? saveError.stack : undefined,
            });
          }
          controller.close();
        } catch (err) {
          console.error("❌ Erreur de stream:", err);
          controller.error(err);
        }
      },
      cancel() {
        stream.textStream.cancel();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("❌ /api/chat error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}
