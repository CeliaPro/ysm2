// lib/compareChunks.ts

import type { RawChunk } from "./upload";

export interface ComparedChunk {
  text: string;
  pageNumber: number | null;
  status: "added" | "removed" | "unchanged";
}

export function compareChunks(
    docA: RawChunk[],
    docB: RawChunk[]
  ): { docA: ComparedChunk[]; docB: ComparedChunk[] } {
    const normalize = (text: string) =>
      text.replace(/\s+/g, " ").trim().toLowerCase();
  
    const hashB = new Map(docB.map((chunk) => [normalize(chunk.pageContent), chunk]));
    const hashA = new Map(docA.map((chunk) => [normalize(chunk.pageContent), chunk]));
  
    const docACompared: ComparedChunk[] = docA.map((chunk) => ({
      text: chunk.pageContent,
      pageNumber: chunk.metadata.pageNumber ?? null,
      status: hashB.has(normalize(chunk.pageContent)) ? "unchanged" : "removed",
    }));
  
    const docBCompared: ComparedChunk[] = docB.map((chunk) => ({
      text: chunk.pageContent,
      pageNumber: chunk.metadata.pageNumber ?? null,
      status: hashA.has(normalize(chunk.pageContent)) ? "unchanged" : "added",
    }));
  
    return { docA: docACompared, docB: docBCompared };
  }
