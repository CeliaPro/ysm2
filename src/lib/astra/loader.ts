// lib/astra/loader.ts
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
 
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ".", " ", ""],
});
 
// 1️⃣ nettoie les sauts de page, en-têtes/pieds et recolle les mots coupés
function cleanText(raw: string): string {
  return raw
    .replace(/Page\s*\d+\s*\|\s*\d+/gi, "")       // retire les lignes “Page X | Y”
    .replace(/-\n(\w+)/g, (_, w) => w)             // recolle les mots coupés
    .replace(/\n{2,}/g, "\n\n")                    // collapse multi-sauts
    .trim();
}
 
// 2️⃣ repère les titres de section “1.2.3 Mon titre…”
function extractHeadings(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => /^\d+(\.\d+)+\s+[A-ZÀ-Ÿ]/.test(l))
    .map((l) => l.trim());
}
 
/**
 * Charge un PDF, nettoie chaque page, en extrait le contexte de section,
 * splitte en chunks et renvoie la liste de chunks enrichis.
 */
export async function loadAndSplitPDFWithContext(
  filePath: string
): Promise<Document[]> {
  // 1) load raw pages
  const loader = new PDFLoader(filePath);
  const rawDocs = await loader.load(); // Document[], chaque doc.pageContent + doc.metadata
 
  // assure pageNumber
  rawDocs.forEach((doc, i) => {
    if (!doc.metadata.pageNumber) doc.metadata.pageNumber = i + 1;
  });
  
 
  const allChunks: Document[] = [];
  let currentHeadings: string[] = [];
 
  // 2) pour chaque page
  for (const page of rawDocs) {
    const text = cleanText(page.pageContent);
 
    // mise à jour des titres s’il y en a
    const heads = extractHeadings(text);
    if (heads.length) currentHeadings = heads;
 
    // splitDocuments hérite de metadata de page
    const chunks = await splitter.splitDocuments([
      new Document({ pageContent: text, metadata: page.metadata }),
    ]);
 
    // enrichit chaque chunk
    for (const chunk of chunks) {
      allChunks.push(
        new Document({
          pageContent:
            (currentHeadings.length
              ? currentHeadings.join(" > ") + "\n\n"
              : "") + chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            sectionTitle: currentHeadings.at(-1) ?? null,
            headingPath: currentHeadings,
          },
        })
      );
    }
  }
 
  return allChunks;
}

