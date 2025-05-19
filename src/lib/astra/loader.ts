// lib/astra/loader.ts
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ".", "!", "?", " "],
});

export const loadAndSplitPDF = async (filePath: string) => {
  const loader = new PDFLoader(filePath);
  const rawDocs = await loader.load();
  return await splitter.splitDocuments(rawDocs);
};

export const getPDFFiles = (folderPath: string) =>
  fs.readdirSync(folderPath).filter((f) => f.endsWith(".pdf"));
