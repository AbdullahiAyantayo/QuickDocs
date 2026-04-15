import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("QuickDocs API Integration Tests", () => {
  let testUserId: string;
  let secondUserId: string;
  let testDocId: string;

  beforeAll(async () => {
    const user1 = await prisma.user.upsert({
      where: { email: "test-alice@test.local" },
      update: {},
      create: { name: "Test Alice", email: "test-alice@test.local" },
    });
    testUserId = user1.id;

    const user2 = await prisma.user.upsert({
      where: { email: "test-bob@test.local" },
      update: {},
      create: { name: "Test Bob", email: "test-bob@test.local" },
    });
    secondUserId = user2.id;
  });

  afterAll(async () => {
    await prisma.documentShare.deleteMany({
      where: {
        OR: [
          { document: { ownerId: testUserId } },
          { userId: secondUserId },
        ],
      },
    });
    await prisma.document.deleteMany({
      where: { ownerId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["test-alice@test.local", "test-bob@test.local"] } },
    });
    await prisma.$disconnect();
  });

  describe("Document CRUD", () => {
    it("should create a document", async () => {
      const doc = await prisma.document.create({
        data: {
          title: "Test Document",
          content: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Hello world" }],
              },
            ],
          }),
          ownerId: testUserId,
        },
      });

      testDocId = doc.id;
      expect(doc.title).toBe("Test Document");
      expect(doc.ownerId).toBe(testUserId);

      const parsed = JSON.parse(doc.content);
      expect(parsed.type).toBe("doc");
      expect(parsed.content[0].content[0].text).toBe("Hello world");
    });

    it("should read a document with owner info", async () => {
      const doc = await prisma.document.findUnique({
        where: { id: testDocId },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          shares: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      expect(doc).not.toBeNull();
      expect(doc!.owner.name).toBe("Test Alice");
      expect(doc!.shares).toHaveLength(0);
    });

    it("should update document title and content", async () => {
      const updated = await prisma.document.update({
        where: { id: testDocId },
        data: {
          title: "Renamed Document",
          content: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Updated heading" }],
              },
            ],
          }),
        },
      });

      expect(updated.title).toBe("Renamed Document");
      const parsed = JSON.parse(updated.content);
      expect(parsed.content[0].type).toBe("heading");
      expect(parsed.content[0].content[0].text).toBe("Updated heading");
    });

    it("should persist document content with rich formatting", async () => {
      const richContent = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "My Document" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", marks: [{ type: "bold" }], text: "Bold text" },
              { type: "text", text: " and " },
              {
                type: "text",
                marks: [{ type: "italic" }],
                text: "italic text",
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
                    content: [{ type: "text", text: "Item 1" }],
                  },
                ],
              },
            ],
          },
        ],
      };

      await prisma.document.update({
        where: { id: testDocId },
        data: { content: JSON.stringify(richContent) },
      });

      const reloaded = await prisma.document.findUnique({
        where: { id: testDocId },
      });
      const parsed = JSON.parse(reloaded!.content);

      expect(parsed.content).toHaveLength(3);
      expect(parsed.content[0].type).toBe("heading");
      expect(parsed.content[1].content[0].marks[0].type).toBe("bold");
      expect(parsed.content[2].type).toBe("bulletList");
    });
  });

  describe("Sharing", () => {
    it("should share a document with another user", async () => {
      const share = await prisma.documentShare.create({
        data: {
          documentId: testDocId,
          userId: secondUserId,
          permission: "edit",
        },
      });

      expect(share.documentId).toBe(testDocId);
      expect(share.userId).toBe(secondUserId);
      expect(share.permission).toBe("edit");
    });

    it("should list shared documents for a user", async () => {
      const shared = await prisma.document.findMany({
        where: {
          shares: { some: { userId: secondUserId } },
        },
      });

      expect(shared.length).toBeGreaterThanOrEqual(1);
      expect(shared.some((d) => d.id === testDocId)).toBe(true);
    });

    it("should separate owned and shared documents", async () => {
      const ownedByAlice = await prisma.document.findMany({
        where: { ownerId: testUserId },
      });
      const sharedWithBob = await prisma.document.findMany({
        where: { shares: { some: { userId: secondUserId } } },
      });

      expect(ownedByAlice.some((d) => d.id === testDocId)).toBe(true);
      expect(sharedWithBob.some((d) => d.id === testDocId)).toBe(true);

      const ownedByBob = await prisma.document.findMany({
        where: { ownerId: secondUserId },
      });
      expect(ownedByBob.some((d) => d.id === testDocId)).toBe(false);
    });

    it("should enforce unique share constraint", async () => {
      await expect(
        prisma.documentShare.create({
          data: {
            documentId: testDocId,
            userId: secondUserId,
            permission: "view",
          },
        })
      ).rejects.toThrow();
    });

    it("should update share permission via upsert", async () => {
      const updated = await prisma.documentShare.upsert({
        where: {
          documentId_userId: {
            documentId: testDocId,
            userId: secondUserId,
          },
        },
        update: { permission: "view" },
        create: {
          documentId: testDocId,
          userId: secondUserId,
          permission: "view",
        },
      });

      expect(updated.permission).toBe("view");
    });

    it("should remove a share", async () => {
      await prisma.documentShare.delete({
        where: {
          documentId_userId: {
            documentId: testDocId,
            userId: secondUserId,
          },
        },
      });

      const shares = await prisma.documentShare.findMany({
        where: { documentId: testDocId },
      });
      expect(shares).toHaveLength(0);
    });
  });

  describe("Document Deletion", () => {
    it("should cascade-delete shares when document is deleted", async () => {
      await prisma.documentShare.create({
        data: {
          documentId: testDocId,
          userId: secondUserId,
          permission: "edit",
        },
      });

      await prisma.document.delete({ where: { id: testDocId } });

      const shares = await prisma.documentShare.findMany({
        where: { documentId: testDocId },
      });
      expect(shares).toHaveLength(0);

      const doc = await prisma.document.findUnique({
        where: { id: testDocId },
      });
      expect(doc).toBeNull();
    });
  });
});
