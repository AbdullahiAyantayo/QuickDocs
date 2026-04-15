import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
  text?: string;
  content?: TiptapNode[];
};

function tiptapToMarkdown(doc: TiptapNode): string {
  if (!doc.content) return "";
  return doc.content.map((node) => nodeToMarkdown(node)).join("\n\n");
}

function nodeToMarkdown(node: TiptapNode): string {
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      const prefix = "#".repeat(level);
      return `${prefix} ${inlineToMarkdown(node.content)}`;
    }
    case "paragraph":
      return inlineToMarkdown(node.content);
    case "bulletList":
      return (node.content || [])
        .map((li) => `- ${listItemToMarkdown(li)}`)
        .join("\n");
    case "orderedList":
      return (node.content || [])
        .map((li, i) => `${i + 1}. ${listItemToMarkdown(li)}`)
        .join("\n");
    case "blockquote":
      return (node.content || [])
        .map((child) => `> ${nodeToMarkdown(child)}`)
        .join("\n");
    case "codeBlock":
      return `\`\`\`\n${inlineToMarkdown(node.content)}\n\`\`\``;
    case "horizontalRule":
      return "---";
    case "image":
      return `![${node.attrs?.alt || "image"}](${node.attrs?.src || ""})`;
    case "video":
      return `[Video: ${node.attrs?.title || "video"}]`;
    default:
      return inlineToMarkdown(node.content);
  }
}

function listItemToMarkdown(node: TiptapNode): string {
  if (!node.content) return "";
  return node.content.map((child) => inlineToMarkdown(child.content)).join(" ");
}

function inlineToMarkdown(content?: TiptapNode[]): string {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.type === "text") {
        let text = node.text || "";
        const marks = node.marks || [];
        for (const mark of marks) {
          if (mark.type === "bold") text = `**${text}**`;
          if (mark.type === "italic") text = `*${text}*`;
          if (mark.type === "underline") text = `__${text}__`;
          if (mark.type === "code") text = `\`${text}\``;
        }
        return text;
      }
      if (node.type === "hardBreak") return "\n";
      return nodeToMarkdown(node);
    })
    .join("");
}

function tiptapToHtml(doc: TiptapNode, title: string): string {
  const bodyHtml = doc.content
    ? doc.content.map((node) => nodeToHtml(node)).join("\n")
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 40px; }
      @page { margin: 1in; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1a1a1a;
    }
    h1 { font-size: 2em; margin: 0.67em 0; font-weight: 700; }
    h2 { font-size: 1.5em; margin: 0.75em 0; font-weight: 600; }
    h3 { font-size: 1.25em; margin: 0.75em 0; font-weight: 600; }
    p { margin: 0.5em 0; }
    ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
    li { margin: 0.25em 0; }
    blockquote { border-left: 3px solid #ddd; padding-left: 1em; margin: 0.5em 0; color: #666; }
    code { background: #f4f4f4; border-radius: 4px; padding: 0.15em 0.3em; font-size: 0.9em; }
    hr { border: none; border-top: 2px solid #eee; margin: 1.5em 0; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
    video { width: 100%; max-width: 640px; border-radius: 8px; margin: 1em 0; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function nodeToHtml(node: TiptapNode): string {
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      return `<h${level}>${inlineToHtml(node.content)}</h${level}>`;
    }
    case "paragraph":
      return `<p>${inlineToHtml(node.content)}</p>`;
    case "bulletList":
      return `<ul>\n${(node.content || []).map((li) => nodeToHtml(li)).join("\n")}\n</ul>`;
    case "orderedList":
      return `<ol>\n${(node.content || []).map((li) => nodeToHtml(li)).join("\n")}\n</ol>`;
    case "listItem":
      return `<li>${(node.content || []).map((child) => inlineToHtml(child.content)).join(" ")}</li>`;
    case "blockquote":
      return `<blockquote>${(node.content || []).map((child) => nodeToHtml(child)).join("\n")}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${escapeHtml(inlineToPlain(node.content))}</code></pre>`;
    case "horizontalRule":
      return "<hr>";
    case "image":
      return `<img src="${node.attrs?.src || ""}" alt="${escapeHtml(String(node.attrs?.alt || ""))}" />`;
    case "video":
      return `<video controls src="${node.attrs?.src || ""}" style="max-width:640px;width:100%;border-radius:8px;"></video>`;
    default:
      return inlineToHtml(node.content);
  }
}

function inlineToHtml(content?: TiptapNode[]): string {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.type === "text") {
        let html = escapeHtml(node.text || "");
        const marks = node.marks || [];
        for (const mark of marks) {
          if (mark.type === "bold") html = `<strong>${html}</strong>`;
          if (mark.type === "italic") html = `<em>${html}</em>`;
          if (mark.type === "underline") html = `<u>${html}</u>`;
          if (mark.type === "code") html = `<code>${html}</code>`;
        }
        return html;
      }
      if (node.type === "hardBreak") return "<br>";
      return nodeToHtml(node);
    })
    .join("");
}

function inlineToPlain(content?: TiptapNode[]): string {
  if (!content) return "";
  return content.map((n) => n.text || "").join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = doc.ownerId === user.id;
  const hasShare = await prisma.documentShare.findFirst({
    where: { documentId: id, userId: user.id },
  });
  if (!isOwner && !hasShare) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format");
  let tiptapDoc: TiptapNode;
  try {
    tiptapDoc = JSON.parse(doc.content);
  } catch {
    return NextResponse.json(
      { error: "Document content is corrupted" },
      { status: 500 }
    );
  }

  if (format === "markdown") {
    const md = tiptapToMarkdown(tiptapDoc);
    const filename = `${doc.title.replace(/[^a-zA-Z0-9 ]/g, "")}.md`;
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (format === "pdf") {
    const html = tiptapToHtml(tiptapDoc, doc.title);
    const filename = `${doc.title.replace(/[^a-zA-Z0-9 ]/g, "")}.html`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json(
    { error: "Invalid format. Use ?format=markdown or ?format=pdf" },
    { status: 400 }
  );
}
