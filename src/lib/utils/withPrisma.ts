import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Fonction améliorée pour gérer les opérations Prisma avec réessais et gestion des erreurs
 */
export async function withPrisma<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Backoff exponentiel entre les tentatives
        const backoff = Math.min(1000 * 2 ** attempt, 10000);
        console.log(`[Prisma] attente de ${backoff}ms avant nouvel essai...`);
        await new Promise((r) => setTimeout(r, backoff));
        
        // Essayer de nettoyer les connexions avant de réessayer
        try {
          // Force une déconnexion et reconnexion pour nettoyer les prepared statements
          await prisma.$disconnect();
          await prisma.$connect();
          console.log("[Prisma] Reconnecté à la base de données");
        } catch (connectError) {
          console.warn("[Prisma] Erreur lors de la reconnexion:", connectError);
        }
      }
      
      // Exécuter l'opération demandée
      return await operation();
      
    } catch (erreur) {
      lastError = erreur;
      
      // Journalisation détaillée de l'erreur
      console.error(`[Prisma] erreur tentative ${attempt + 1}/${maxRetries}:`, 
        erreur instanceof Error ? erreur.message : String(erreur));
      
      // Déterminer si l'erreur est réessayable
      const isKnownRequestError = erreur instanceof Prisma.PrismaClientKnownRequestError;
      const isUnknownRequestError = erreur instanceof Prisma.PrismaClientUnknownRequestError;
      
      let shouldRetry = false;
      
      // Vérifier les erreurs Prisma connues que nous voulons réessayer
      if (isKnownRequestError) {
        const retryablePrismaCodes = ["P2015", "P1017"];
        shouldRetry = retryablePrismaCodes.includes(erreur.code);
      }
      
      // Vérifier les erreurs PostgreSQL dans les erreurs inconnues
      if (!shouldRetry && isUnknownRequestError) {
        const errorMsg = String(erreur).toLowerCase();
        
        // Liste élargie des motifs d'erreur à réessayer
        const retryablePatterns = [
          "prepared statement .* already exists",  // 42P05
          "deadlock detected",                     // 40001
          "connection has been terminated",
          "connection timed out",
          "too many clients",
          "cannot acquire lock",
          "serialization failure"                  // 40001
        ];
        
        shouldRetry = retryablePatterns.some(pattern => 
          new RegExp(pattern).test(errorMsg)
        );
      }
      
      if (shouldRetry) {
        console.warn(`[Prisma] tentative de réessai ${attempt + 1}/${maxRetries}`);
        continue;
      }
      
      // Si nous ne pouvons pas réessayer, relancer l'erreur
      throw erreur;
    }
  }
  
  // Si nous avons épuisé toutes les tentatives, lancer la dernière erreur
  console.error(`[Prisma] échec après ${maxRetries} tentatives`);
  throw lastError;
}