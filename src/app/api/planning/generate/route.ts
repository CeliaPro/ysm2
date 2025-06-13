// app/api/planning/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getPlanningCollection,
  ensurePlanningCollection,
  PlanningTask,
  MissingField,
} from '@/lib/astra/planning';
import { OpenAI } from 'openai';
import { addMessageToConversation } from "@/lib/actions/conversations/conversation";
import { withAuthentication } from '@/app/utils/auth.utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}

export const POST = withAuthentication(async (req: NextRequest, user) => {
  try {
    const { sectionText, projectId } = await req.json();

    if (typeof sectionText !== 'string' || !sectionText.trim()) {
      return NextResponse.json({ success: false, error: 'Le texte de la section est requis.' }, { status: 400 });
    }
    if (typeof projectId !== 'string' || !projectId.trim()) {
      return NextResponse.json({ success: false, error: 'L\'identifiant du projet est requis.' }, { status: 400 });
    }

    await ensurePlanningCollection();
    const collection = getPlanningCollection();

    // GPT Prompt
    const systemPrompt = `
Vous êtes un assistant expert en planification de projet.

À partir d'une section de cahier des charges technique incluant une date de début et une date de fin globale du projet, extrayez une structure de découpage du travail (WBS).

Chaque tâche doit comporter :
  • task (string)
  • description (string)
  • duration (nombre de jours) ou null si inconnu
  • dependsOn (nom de la tâche dont elle dépend) ou null si aucune
  • responsibleRole (string) ou null si inconnu

Utilisez les dates de début et fin globales pour estimer intelligemment les durées manquantes des tâches, en supposant que les tâches se déroulent séquentiellement ou selon les dépendances.

Si certaines tâches ont des durées connues et d'autres non, répartissez le temps restant de façon proportionnelle ou raisonnable.

Si vous ne pouvez pas déduire raisonnablement certains champs, incluez-les dans le tableau "missingFields" avec des questions à poser à l'utilisateur.

Retournez un objet JSON avec exactement deux clés :
1) "partialWBS" : un tableau de tâches avec les champs remplis, durées estimées si possible.
2) "missingFields" : un tableau d'objets { task, field, question } pour les champs non inférés.

N'incluez aucun texte explicatif — uniquement du JSON valide.
`;

    const userPrompt = `
Specification Section:
"""${sectionText}"""
`;

    // Run GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0].message?.content;
    if (!raw) {
      return NextResponse.json({ success: false, error: 'Aucun contenu généré par le LLM.' }, { status: 500 });
    }

    // Parse JSON from the model response
    let parsed: {
      partialWBS: PlanningTask[];
      missingFields: MissingField[];
    };
    try {
      const cleanJson = raw
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      parsed = JSON.parse(cleanJson);

      if (
        !Array.isArray(parsed.partialWBS) ||
        !Array.isArray(parsed.missingFields)
      ) {
        throw new Error("Format JSON renvoyé invalide.");
      }
    } catch (err) {
      console.error("Erreur lors du parsing du JSON généré par le LLM:", err);
      return NextResponse.json(
        { success: false, error: "Impossible d'analyser le JSON structuré de la réponse IA." },
        { status: 500 }
      );
    }

    // Insert planning doc in Astra
    const document = {
      projectId,
      sourceSection: sectionText,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      partialWBS: parsed.partialWBS,
      missingFields: parsed.missingFields,
      pendingQuestions: parsed.missingFields.map(({ task, field }) => ({ task, field })),
    };

    const insertResult = await collection.insertOne(document) as unknown;
    const planningId = (insertResult as { documentId: string }).documentId;

    // Log user message
    await addMessageToConversation({
      conversationId: projectId,
      userId: user.id,
      content: sectionText,
      role: "USER",
      metadata: {
        mode: "planning",
        timestamp: Date.now(),
      },
    });

    // Format assistant response (Markdown for UI)
    const assistantContent = [
      "🛠️ **AI Planning Assistant**",
      "",
      "### 🧱 Structure de découpage du travail :",
      ...parsed.partialWBS.map(
        (t) =>
          `- **${t.task}** (${t.description}) – _${t.duration ?? "???"} jours_`
      ),
      "",
      parsed.missingFields.length > 0
        ? [
            "### ❓ Informations manquantes :",
            ...parsed.missingFields.map((f) => `• ${f.question}`)
          ].join("\n")
        : "✅ Aucune information manquante !"
    ].join("\n");

    await addMessageToConversation({
      conversationId: projectId,
      userId: user.id,
      content: assistantContent,
      role: "ASSISTANT",
      metadata: {
        planningId,
        mode: "planning",
        timestamp: Date.now(),
      },
    });

    // Return results
    return NextResponse.json({
      success: true,
      planningId,
      partialWBS: parsed.partialWBS,
      missingFields: parsed.missingFields,
      assistantContent,
    });

  } catch (error: any) {
    console.error('Erreur inattendue dans /api/planning/generate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}, 'EMPLOYEE');
