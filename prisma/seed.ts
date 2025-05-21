import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Hash the passwords
  const password = await hash('password', 10)

  // Create users with hashed passwords
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password,
      role: 'ADMIN',
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password,
      name: 'Manager User',
      role: 'MANAGER',
    },
  })

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      email: 'employee@example.com',
      password,
      name: 'Employee User',
      role: 'EMPLOYEE',
    },
  })

  // Create projects
  const project1 = await prisma.project.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Corporate Website Redesign',
      description: 'Redesigning the company website with modern UI/UX',
      members: {
        create: [
          {
            userId: adminUser.id,
            role: 'OWNER',
          },
          {
            userId: managerUser.id,
            role: 'EDITOR',
          },
        ],
      },
    },
  })

  // Create storage policies
  await prisma.storagePolicy.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      projectId: project1.id,
      maxSizeMb: 50,
      // allowedFileTypes: ['pdf', 'docx', 'xlsx', 'jpg', 'png'],
      // retentionPeriod: 90, // 90 days
    },
  })

  // Create documents
  const document1 = await prisma.document.upsert({
    where: { id: '1' },
    update: {},
    create: {
      url: 'https://www.google.com',
      id: '1',
      name: 'Website Mockups',
      description: 'Initial mockups for website redesign',
      size: 2048576, // 2MB
      type: 'pdf',
      archived: false,
     favorite: false,
      project: { connect: { id: project1.id } },
      user: { connect: { id: adminUser.id } },
      tags: {
        create: [{ name: 'design' }, { name: 'mockup' }],
      },
    },
  })
  //
  //   // Create AI Configurations
  //   const aiConfig = await prisma.AIConfiguration.upsert({
  //     where: { id: '1' },
  //     update: {},
  //     create: {
  //       id: '1',
  //       name: 'Document Assistant',
  //       model: 'gpt-4',
  //       maxTokens: 4000,
  //       temperature: 0.7,
  //       createdBy: adminUser.id,
  //     },
  //   })
  //
  //   // Create AI Prompts
  //   await prisma.aIPrompt.upsert({
  //     where: { id: '1' },
  //     update: {},
  //     create: {
  //       id: '1',
  //       configurationId: aiConfig.id,
  //       promptText: 'Summarize the following document: {{document}}',
  //       purpose: 'document-summary',
  //       createdBy: adminUser.id,
  //     },
  //   })
  //
  //   // Create AI Conversations
  //   const conversation = await prisma.aIConversation.upsert({
  //     where: { id: '1' },
  //     update: {},
  //     create: {
  //       id: '1',
  //       userId: adminUser.id,
  //       projectId: project1.id,
  //       documentId: document1.id,
  //       title: 'Website Design Discussion',
  //     },
  //   })
  //
  //   // Create AI Messages
  //   await prisma.aIMessage.upsert({
  //     where: { id: '1' },
  //     update: {},
  //     create: {
  //       id: '1',
  //       conversationId: conversation.id,
  //       role: 'user',
  //       content: 'Can you analyze these website mockups?',
  //       timestamp: new Date(),
  //       tokensUsed: 10,
  //     },
  //   })
  //
  //   // Create Activity Logs
  //   await prisma.activityLog.upsert({
  //     where: { id: '1' },
  //     update: {},
  //     create: {
  //       id: '1',
  //       userId: adminUser.id,
  //       projectId: project1.id,
  //       actionType: 'CREATE',
  //       actionDetails: 'Created project: Corporate Website Redesign',
  //     },
  //   })
  //
  //   console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
