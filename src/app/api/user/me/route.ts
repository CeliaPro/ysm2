import { withAuthentication } from '@/app/utils/auth.utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'test abc' }, { status: 401 })
}
//   // try {
//   //   const { userId: userId } = await getUserFromRequest(req);
//   //
//   //   const user = await prisma.user.findUnique({
//   //     where: { id: userId },
//   //     select: { id: true, name: true, email: true, role: true },
//   //   });
//   //
//   //   if (!user) return new NextResponse('User not found', { status: 404 });
//   //   return NextResponse.json(user);
//   // } catch {
//   //   return new NextResponse('Unauthorized', { status: 401 });
//   // }
// }

// export const GET = withAuthentication(async () => {
//   console.log('yo')
//   return { userId: 'user.id' }
// })
