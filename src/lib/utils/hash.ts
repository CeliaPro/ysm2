import { createHash } from 'crypto';

/**
 * Retourne un SHA256 hexadécimal pour un texte donné
 */
export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
