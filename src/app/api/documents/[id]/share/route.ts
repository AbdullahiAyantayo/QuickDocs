import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Only the owner can share this document" },
      { status: 403 }
    );
  }

  const { email, permission = "edit" } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (targetUser.id === user.id) {
    return NextResponse.json(
      { error: "Cannot share with yourself" },
      { status: 400 }
    );
  }

  const share = await prisma.documentShare.upsert({
    where: {
      documentId_userId: { documentId: id, userId: targetUser.id },
    },
    update: { permission },
    create: {
      documentId: id,
      userId: targetUser.id,
      permission,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(share, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Only the owner can manage shares" },
      { status: 403 }
    );
  }

  const { userId } = await request.json();
  await prisma.documentShare.delete({
    where: { documentId_userId: { documentId: id, userId } },
  });

  return NextResponse.json({ success: true });
}
