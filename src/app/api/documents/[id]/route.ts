import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccess(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { shares: true },
  });
  if (!doc) return { doc: null, permission: null };

  if (doc.ownerId === userId) return { doc, permission: "owner" as const };

  const share = doc.shares.find((s) => s.userId === userId);
  if (share) return { doc, permission: share.permission };

  return { doc: null, permission: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { doc, permission } = await canAccess(id, user.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fullDoc = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ ...fullDoc, permission });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { permission } = await canAccess(id, user.id);
  if (!permission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (permission === "view") {
    return NextResponse.json({ error: "View-only access" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, string> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;

  const doc = await prisma.document.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(doc);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can delete" }, { status: 403 });
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
