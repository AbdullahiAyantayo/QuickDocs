import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await prisma.document.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  const shared = await prisma.document.findMany({
    where: {
      shares: { some: { userId: user.id } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ owned, shared });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const doc = await prisma.document.create({
    data: {
      title: body.title || "Untitled Document",
      content: body.content || JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
      ownerId: user.id,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
