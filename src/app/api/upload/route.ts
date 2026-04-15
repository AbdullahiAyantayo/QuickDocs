import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";

function markdownToTiptap(md: string) {
  const lines = md.split("\n");
  const content: Record<string, unknown>[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      continue;
    }

    const h1 = line.match(/^# (.+)/);
    if (h1) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: h1[1] }],
      });
      continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: h2[1] }],
      });
      continue;
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: h3[1] }],
      });
      continue;
    }

    content.push({
      type: "paragraph",
      content: parseInlineFormatting(line),
    });
  }

  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}

function parseInlineFormatting(text: string) {
  const nodes: Record<string, unknown>[] = [];
  const regex =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_|`(.+?)`)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      nodes.push({
        type: "text",
        marks: [{ type: "bold" }, { type: "italic" }],
        text: match[2],
      });
    } else if (match[3]) {
      nodes.push({
        type: "text",
        marks: [{ type: "bold" }],
        text: match[3],
      });
    } else if (match[4]) {
      nodes.push({
        type: "text",
        marks: [{ type: "italic" }],
        text: match[4],
      });
    } else if (match[5]) {
      nodes.push({
        type: "text",
        marks: [{ type: "underline" }],
        text: match[5],
      });
    } else if (match[6]) {
      nodes.push({
        type: "text",
        marks: [{ type: "italic" }],
        text: match[6],
      });
    } else if (match[7]) {
      nodes.push({
        type: "text",
        marks: [{ type: "code" }],
        text: match[7],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  if (nodes.length === 0) {
    nodes.push({ type: "text", text });
  }

  return nodes;
}

function textToTiptap(text: string) {
  const lines = text.split("\n");
  const content = lines.map((line) => {
    if (line.trim() === "") {
      return { type: "paragraph" };
    }
    return {
      type: "paragraph",
      content: [{ type: "text", text: line }],
    };
  });

  return { type: "doc", content };
}

function htmlToTiptapNodes(html: string) {
  const content: Record<string, unknown>[] = [];

  const blockPattern =
    /<(p|h[1-6]|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let blockMatch;
  let lastBlockEnd = 0;

  while ((blockMatch = blockPattern.exec(html)) !== null) {
    const tag = blockMatch[1].toLowerCase();
    const inner = blockMatch[2];
    const plainText = inner.replace(/<[^>]+>/g, "").trim();

    if (!plainText) continue;

    if (tag.match(/^h[1-3]$/)) {
      const level = parseInt(tag[1]);
      content.push({
        type: "heading",
        attrs: { level },
        content: parseHtmlInline(inner),
      });
    } else {
      content.push({
        type: "paragraph",
        content: parseHtmlInline(inner),
      });
    }
    lastBlockEnd = blockMatch.index + blockMatch[0].length;
  }

  if (content.length === 0) {
    const stripped = html.replace(/<[^>]+>/g, "").trim();
    if (stripped) {
      const lines = stripped.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: line.trim() }],
        });
      }
    } else {
      content.push({ type: "paragraph" });
    }
  }

  return { type: "doc", content };
}

function parseHtmlInline(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  const inlinePattern =
    /<(strong|b|em|i|u|s)>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let inlineMatch;

  const tempText = text.replace(/<[^>]+>/g, "");

  if (!inlinePattern.test(text)) {
    const plain = text.replace(/<[^>]+>/g, "").trim();
    if (plain) {
      nodes.push({ type: "text", text: plain });
    }
    return nodes.length > 0 ? nodes : [{ type: "text", text: " " }];
  }

  inlinePattern.lastIndex = 0;
  while ((inlineMatch = inlinePattern.exec(text)) !== null) {
    if (inlineMatch.index > lastIndex) {
      const before = text.slice(lastIndex, inlineMatch.index).replace(/<[^>]+>/g, "");
      if (before.trim()) {
        nodes.push({ type: "text", text: before });
      }
    }

    const tag = inlineMatch[1].toLowerCase();
    const innerText = inlineMatch[2].replace(/<[^>]+>/g, "").trim();

    if (innerText) {
      const marks: { type: string }[] = [];
      if (tag === "strong" || tag === "b") marks.push({ type: "bold" });
      if (tag === "em" || tag === "i") marks.push({ type: "italic" });
      if (tag === "u") marks.push({ type: "underline" });

      nodes.push({ type: "text", marks, text: innerText });
    }

    lastIndex = inlineMatch.index + inlineMatch[0].length;
  }

  if (lastIndex < text.length) {
    const after = text.slice(lastIndex).replace(/<[^>]+>/g, "").trim();
    if (after) {
      nodes.push({ type: "text", text: after });
    }
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text: tempText || " " }];
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = [".txt", ".md", ".docx"];
  const ext = "." + file.name.split(".").pop()?.toLowerCase();

  if (!allowedTypes.includes(ext)) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Supported formats: .txt, .md, .docx",
      },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  const title = file.name.replace(/\.(txt|md|docx)$/i, "");
  let tiptapContent;

  try {
    if (ext === ".docx") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.convertToHtml({ buffer });
      tiptapContent = htmlToTiptapNodes(result.value);
    } else if (ext === ".md") {
      const text = await file.text();
      tiptapContent = markdownToTiptap(text);
    } else {
      const text = await file.text();
      tiptapContent = textToTiptap(text);
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to parse file. The file may be corrupted." },
      { status: 422 }
    );
  }

  const doc = await prisma.document.create({
    data: {
      title,
      content: JSON.stringify(tiptapContent),
      ownerId: user.id,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
