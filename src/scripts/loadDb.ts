import { DataAPIClient } from "@datastax/astra-db-ts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import "dotenv/config";

// Load env variables
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

// Init OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Init Astra DB client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT!, {
  namespace: ASTRA_DB_NAMESPACE!,
});

// Splitter config (how we chunk the documents)
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ".", "!", "?", " "], // ordre de priorité
});

// STEP 1 - Create collection in Astra DB
const createCollection = async () => {
  try {
    const result = await db.createCollection(ASTRA_DB_COLLECTION!, {
      vector: {
        dimension: 1536,
        metric: "dot_product",
      },
    });
    console.log(" Collection created:", result);
  } catch (err: any) {
    if (err?.message?.includes("already exists")) {
      console.log("Collection already exists, skipping...");
    } else {
      throw err;
    }
  }
};

// STEP 2 - Load and process all PDFs
const processAllPDFsInFolder = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION!);
  const pdfFolder = path.join(__dirname, "..", "pdfs");

  // Vérifie si le dossier existe
  if (!fs.existsSync(pdfFolder)) {
    throw new Error(` Le dossier ${pdfFolder} n'existe pas. Crée le et ajoute des PDF.`);
  }

  const files = fs.readdirSync(pdfFolder);

  for (const file of files) {
    if (file.endsWith(".pdf")) {
      const filePath = path.join(pdfFolder, file);
      console.log(`Processing: ${filePath}`);

      const loader = new PDFLoader(filePath);
      const rawDocs = await loader.load();
      const docs = await splitter.splitDocuments(rawDocs);

      for (const doc of docs) {
        const text = doc.pageContent;
        const embedding = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
          encoding_format: "float",
        });

        const vector = embedding.data[0].embedding;

        await collection.insertOne({
          $vector: vector,
          text,
          metadata: {
            source: file,
          },
        });
      }

      console.log(`${file} processed and stored.`);
    }
  }
};

// MAIN
const main = async () => {
  await createCollection();
  await processAllPDFsInFolder();
};

main();
