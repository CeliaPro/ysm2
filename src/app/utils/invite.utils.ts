import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_INVITE_SECRET as string

export function generateInviteToken(email: string, name: string) {
  return jwt.sign(
    {
      name,
      email,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  )
}

export function extractEmailFromToken(token: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = jwt.verify(token, JWT_SECRET) as any
  return {
    name: obj.name,
    email: obj.email,
  }
}

export function generateInviteEmailParams(
  name: string,
  email: string,
  inviteLink: string
) {
  return {
    Source: '"YSM Inc." <noreply@nerlana.com>',
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Invite to YSM',
      },
      Body: {
        Html: {
          Data: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation Email</title>
  <style>
    body {
      font-family: Helvetica, sans-serif;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      font-size: 45px;
      color: #121212;
      line-height: 125%;
      font-weight: 400;
    }
    h2 {
      font-size: 22px;
      color: #121212;
      margin-top: 40px;
    }
    p {
      font-size: 14px;
      line-height: 150%;
      color: #121212;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 10px;
    }
    .button {
      display: inline-block;
      background-color: #1966ff;
      color: #fff;
      font-weight: 700;
      text-decoration: none;
      padding: 15px 25px;
      border-radius: 3px;
      margin-top: 20px;
    }
    .footer {
      font-size: 12px;
      color: #121212;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://local.mlcdn.com/a/0/1/images/001971659265af5d622ea7400f005543875a4b9d.png" width="100" alt="Logo" />
    
    <hr />

    <h1><strong>Invitation to work <span style="color:#1966ff">together</span></strong></h1>

    <p>Dear <strong style="color:#1966ff">${name}</strong> you are invited to join YSM Network. Work better together by simplifying and organizing your team projects with these collaborative features:</p>

    <ul>
      <li><strong style="color:#1966ff">Schedule events</strong> to reach your goals and milestones</li>
      <li><strong style="color:#1966ff">Set roles</strong> for each teammate and see how each of them are doing</li>
      <li><strong style="color:#1966ff">Track time</strong> to optimize how you complete each project</li>
      <li><strong style="color:#1966ff">Use version history</strong> to undo changes any time</li>
    </ul>

    <h2><strong>Ready to kick off your projects?</strong></h2>
    <p>Click the button below to create an account and start collaborating!</p>

    <a class="m_6711687068177356353mlContentButton" style="font-family:Helvetica,sans-serif;background-color:#1966ff;border-radius:3px;color:#fff;display:inline-block;font-size:14px;line-height:20px;padding:15px 0 15px 0;text-align:center;text-decoration:none;width:200px;font-weight:700;font-style:normal;text-decoration:none" target="_blank" href="${inviteLink}">Sign up now</a>
  </div>
</body>
</html>
`,
        },
      },
    },
  }
}
