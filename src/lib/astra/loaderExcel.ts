import fs from "fs/promises";
import * as XLSX from "xlsx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { Document } from "langchain/document";

// Même splitter que pour le PDF
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ".", "!", "?", " "],
});

/**
 * Charge un fichier XLSX, l'extrait en texte pageSheet/ligne,
 * injecte métadonnées (sheetName, rowIndex), et découpe.
 */
export async function loadAndSplitExcel(filePath: string): Promise<Document[]> {
  // 1️⃣ Lire le fichier en mémoire
  const buffer = await fs.readFile(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  // 2️⃣ Transformer chaque sheet en tableau d'objets JS
  const docs: Document[] = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    
    const rows: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
    });

    // 3️⃣ Pour chaque ligne, concaténer les cellules en texte
    rows.forEach((cells, rowIndex) => {
      const text = cells
        .map((cell) => (cell == null ? "" : String(cell)))
        .join(" | ")
        .trim();
      if (!text) return;

      docs.push({
        pageContent: text,
        metadata: {
          sheetName,
          rowIndex: rowIndex + 1,
        },
      });
    });
  });

  // 4️⃣ Découper chaque "document" en chunks
  const split = await splitter.splitDocuments(docs);
  return split;
}
