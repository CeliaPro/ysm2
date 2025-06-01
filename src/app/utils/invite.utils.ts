import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

// only these two roles can be embedded in an invite
export type InviteRole = 'EMPLOYEE' | 'MANAGER'

const JWT_SECRET = process.env.JWT_INVITE_SECRET as string

export function generateInviteToken(
  email: string,
  name: string,
  role: InviteRole,
  projects: string[] = []
) {
  return jwt.sign(
    { name, email, role, projects },
    JWT_SECRET,
    { expiresIn: '1d' }
  )
}

export function extractInvitePayload(token: string) {
  const obj = jwt.verify(token, JWT_SECRET) as {
    name: string
    email: string
    role: InviteRole
    projects?: string[]
  }
  // runtime guard (optional but extra-safe)
  if (obj.role !== 'EMPLOYEE' && obj.role !== 'MANAGER') {
    throw new Error(`Invalid invite role: ${obj.role}`)
  }
  return {
    name: obj.name,
    email: obj.email,
    role: obj.role,
    projects: obj.projects ?? []
  }
}

export function generateInviteEmailParams(
  name: string,
  email: string,
  inviteLink: string,
  projects: string[] = [],
  logoUrl: string
) {
  // Generate HTML for the list of projects
  const projectListHtml = projects.length
    ? `<ul>${projects.map(p => `<li>${p}</li>`).join('')}</ul>`
    : `<p><em>Aucun projet assigné pour le moment.</em></p>`

  return {
    Source: '"YSM Inc." <noreply@nerlana.com>',
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'Invitation à rejoindre YSM' },
      Body: {
        Html: {
          Data: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation à rejoindre YSM</title>
  <style>
    body { font-family: Helvetica, sans-serif; background-color: #fff; margin: 0; padding: 0; }
    .container { max-width: 680px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 28px; color: #121212; font-weight: 600; }
    p { font-size: 15px; color: #121212; }
    ul { padding-left: 22px; }
    li { margin-bottom: 6px; }
    .button { display: inline-block; background-color: #1966ff; color: #fff; font-weight:700; text-decoration:none; padding:13px 24px; border-radius:3px; margin-top:20px; }
    .footer { font-size:12px; color:#121212; margin-top:40px; }
    .projects-label { margin-top:24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
     <img src="${logoUrl}" width="100" alt="YSM Logo" />
    " width="100" alt="YSM Logo" />
    <hr />
    <h1>Bonjour ${name},</h1>
    <p>
      Vous êtes invité(e) à rejoindre l'équipe YSM en tant que collaborateur(trice).
    </p>
    <div class="projects-label">Projets assignés :</div>
    ${projectListHtml}
    <p>
      Pour accepter cette invitation et créer votre compte, cliquez sur le bouton ci-dessous.
    </p>
    <a class="button" href="${inviteLink}" target="_blank">Rejoindre YSM</a>
    <p class="footer">
      Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce message.
    </p>
  </div>
</body>
</html>
`
        }
      }
    }
  }
}
