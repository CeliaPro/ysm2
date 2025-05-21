import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('password', 10);

  // 🔐 Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password,
      role: 'ADMIN',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password,
      name: 'Manager User',
      role: 'MANAGER',
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      email: 'employee@example.com',
      password,
      name: 'Employee User',
      role: 'EMPLOYEE',
    },
  });

  // 📁 Create Project
  const project1 = await prisma.project.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Corporate Website Redesign',
      description: 'Redesigning the company website with modern UI/UX',
      members: {
        create: [
          { userId: adminUser.id, role: 'OWNER' },
          { userId: managerUser.id, role: 'EDITOR' },
        ],
      },
    },
  });

  // 📦 Storage policy
  await prisma.storagePolicy.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      projectId: project1.id,
      maxSizeMb: 50,
    },
  });

  // 📄 Create Document
  const document1 = await prisma.document.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      url: 'https://www.google.com',
      name: 'Website Mockups',
      description: 'Initial mockups for website redesign',
      size: 2048576,
      type: 'pdf',
      archived: false,
      favorite: false,
      project: { connect: { id: project1.id } },
      user: { connect: { id: adminUser.id } },
      tags: {
        create: [{ name: 'design' }, { name: 'mockup' }],
      },
    },
  });

  // 🤖 AI Conversation
  const conversation = await prisma.conversation.create({
    data: {
      userId: adminUser.id,
      title: 'Demo Conversation',
      summary: 'Résumé de démo',
    },
  });

  // 💬 Messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Bonjour, comment puis-je vous aider ?',
        role: 'ASSISTANT',
        conversationId: conversation.id,
        userId: null,
        liked: true,
      },
      {
        content: 'Peux-tu me résumer le document ?',
        role: 'USER',
        conversationId: conversation.id,
        userId: adminUser.id,
        liked: true,
      },
    ],
  });

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
