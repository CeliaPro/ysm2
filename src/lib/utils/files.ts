// lib/utils/files.ts
export async function conversationHasDocuments(conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/chat/getDocs?conversationId=${conversationId}`);
    if (!response.ok) throw new Error("Échec de récupération des documents");

    const docs = await response.json();
    return Array.isArray(docs) && docs.length > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification des documents :", error);
    return false;
  }
}
