import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: "alice@quickdocs.demo" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@quickdocs.demo",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@quickdocs.demo" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@quickdocs.demo",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@quickdocs.demo" },
    update: {},
    create: {
      name: "Charlie Davis",
      email: "charlie@quickdocs.demo",
    },
  });

  const welcomeContent = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Welcome to QuickDocs" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This is a collaborative document editor. Try out the rich text features:",
          },
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "bold" }], text: "Bold" },
                  { type: "text", text: ", " },
                  { type: "text", marks: [{ type: "italic" }], text: "italic" },
                  { type: "text", text: ", and " },
                  {
                    type: "text",
                    marks: [{ type: "underline" }],
                    text: "underline",
                  },
                  { type: "text", text: " formatting" },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Multiple heading levels" },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Bulleted and numbered lists" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Share this document with other users using the Share button!",
          },
        ],
      },
    ],
  });

  await prisma.document.upsert({
    where: { id: "welcome-doc" },
    update: {},
    create: {
      id: "welcome-doc",
      title: "Welcome to QuickDocs",
      content: welcomeContent,
      ownerId: alice.id,
    },
  });

  await prisma.documentShare.upsert({
    where: {
      documentId_userId: {
        documentId: "welcome-doc",
        userId: bob.id,
      },
    },
    update: {},
    create: {
      documentId: "welcome-doc",
      userId: bob.id,
      permission: "edit",
    },
  });

  console.log("Seeded users:", { alice, bob, charlie });
  console.log("Seeded welcome document shared from Alice to Bob");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
