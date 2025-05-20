// /app/api/auth/logout/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ message: 'Déconnexion réussie' })

  // Clear the "jwt" cookie by setting it to empty and expired
  response.cookies.set('jwt', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    expires: new Date(0), // expires in the past
  })

  return response
}
