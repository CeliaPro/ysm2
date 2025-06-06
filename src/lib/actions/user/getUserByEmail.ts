import { prisma } from '@/lib/prisma'

export async function getUserByEmail(email: string) {
  return await prisma.user.findFirst({
    where: { email },
  });
}