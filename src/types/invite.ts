export interface Invite {
  id: string
  email: string
  token: string
  invitedByAdminId: string
  createdAt: Date
  expiresAt: Date
  used: boolean
}