import nodemailer from 'nodemailer';

// export async function sendVerificationEmail(email: string, token: string) {
//   const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;

//   await transporter.sendMail({
//     from: process.env.EMAIL_USERNAME,
//     to: email,
//     subject: 'Verify your email',
//     html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
//   });
// }


const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Reusable generic email sender
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to,
    subject,
    html,
  });
};

// Specific email verification sender
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your email',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
  });
}

export async function sendInviteEmail(email: string, token: string) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/register?token=${token}`

  await sendEmail({
    to: email,
    subject: 'You are invited to join our platform',
    html: `<p>You’ve been invited! Click <a href="${inviteUrl}">here</a> to register.</p>`,
  })
}
