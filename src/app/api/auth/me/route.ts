import { withAuthentication } from '@/app/utils/auth.utils' // Ensure correct import path

export const GET = withAuthentication(async (req, user) => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  }
}, 'EMPLOYEE')
