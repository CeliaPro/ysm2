import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import OpenAI from "openai"

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"


import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine"  | "euclidean"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
}= process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });


// Data to scriptting
const data = [
    'https://fr.wikipedia.org/wiki/Championnat_du_monde_de_Formule_1_2024',
    'https://www.france24.com/fr/info-en-continu/20250322-f1-oscar-piastri-mclaren-partira-en-pole-position-du-gp-de-chine',

]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT,{namespace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const createCollection = async (similarityMetric : SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector:{
            dimension: 1536,
            metric: similarityMetric

        }
    })
    console.log(res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await (const url of data){
       const content = await scrapePage(url)
       const chunks = await splitter.splitText(content)
       for await (const chunk of chunks){
           const embeddings = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format : "float"
           })

           const vector = embeddings.data[0].embedding

           const res = await collection.insertOne({
                $vector: vector,
                text: chunk
              })
       }
    }
}

const scrapePage = async (url: string) => {

    const loader = new PuppeteerWebBaseLoader(url,{
        launchOptions: {
            headless: true, 
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })

    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}

createCollection().then(() => loadSampleData())