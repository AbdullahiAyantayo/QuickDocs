# Architecture Note

## What I Prioritized and Why

### 1. Document Editing Experience (Highest Priority)

The document editor is the core interaction surface — it's what reviewers will spend the most time with. I chose **Tiptap** (built on ProseMirror) because:

- It stores documents as **structured JSON** rather than raw HTML, which means content is predictable, queryable, and immune to XSS by default.
- The extension ecosystem is mature: bold, italic, underline, headings, lists, images, and YouTube embeds all work via composable plugins.
- Auto-save with debounce (1.5s) gives a polished, "Google Docs-like" feel without the complexity of operational transforms.

I added a **manual save button** (plus Ctrl+S) alongside auto-save because users expect explicit save control, especially when editing something important. The save status indicator (Saved / Saving / Unsaved) provides clear feedback.

### 2. Sharing Model (High Priority — This Is the "Product Thinking" Surface)

I designed a simple but complete sharing model:

```
Document (owner_id) ──< DocumentShare (document_id, user_id, permission)
```

Key design decisions:
- **Permissions are "edit" or "view"** — enough to demonstrate access control without overengineering.
- **Only the owner can share, revoke, or delete** — this maps to real-world mental models.
- **The dashboard separates "My Documents" and "Shared with Me"** — this is a small UX detail that communicates ownership clearly.
- **Unique constraint on (document_id, user_id)** prevents duplicate shares; upsert handles permission updates gracefully.

With more time, I'd add role-based access (viewer, commenter, editor, admin) and link-based sharing.

### 3. File Import (Medium Priority)

I chose to support **.txt**, **.md**, and **.docx** because these cover the most common document interchange formats:

- `.txt` → plain paragraphs
- `.md` → parsed into headings, bold/italic/underline, code blocks
- `.docx` → converted via **Mammoth.js** (a battle-tested library for Word documents), preserving headings and inline formatting

The import flow creates a new editable document — this is the most "product-relevant" behavior versus just attaching files.

### 4. Export (Markdown + PDF)

Export is the natural complement to import. I implemented:
- **Markdown export**: walks the Tiptap JSON tree and outputs `.md` syntax
- **PDF export**: generates a clean HTML document and opens it in a print view — the browser's native Print → Save as PDF handles the rendering perfectly. This avoids pulling in a server-side PDF library (Puppeteer, wkhtmltopdf) that would add deployment complexity.

### 5. Media Embedding

Images and videos are stored as **base64 data URLs** in the document JSON. This is a pragmatic tradeoff:
- **Pro**: No file storage infrastructure needed, documents are self-contained, works seamlessly across serverless deployments
- **Con**: Large media bloats the document record

For a production system, I'd store media in S3/Cloudflare R2 and reference by URL. For this scope, base64 is correct.

Video upload uses a custom Tiptap node extension that renders `<video>` elements with native browser controls. This gives users a real file upload experience rather than requiring them to find a URL.

## What I Deprioritized

| Feature | Why |
|---|---|
| Real-time collaboration | Requires operational transforms or CRDTs (Yjs), websocket infrastructure — too complex for 4-6 hours |
| Full authentication | Mock auth (user selector + cookie) is sufficient to demonstrate the sharing model. Production would use NextAuth.js or Supabase Auth |
| Mobile-optimized UI | Desktop-first is the right tradeoff for a review scenario; the app is still usable on mobile |
| Version history | Would be a natural next step — a `DocumentVersion` table with periodic snapshots |
| Comments / suggestions | Significant UX and data model complexity for marginal demo value |
| Server-side PDF generation | Browser print-to-PDF is more reliable across environments and requires zero infrastructure |

## Database Schema

PostgreSQL (via Neon free tier) is used for both local development and Vercel deployment. This avoids the SQLite-on-serverless problem entirely and gives us a production-grade database from the start.

```
User (id, name, email, createdAt)
  └── Document (id, title, content:JSON, ownerId, createdAt, updatedAt)
        └── DocumentShare (id, documentId, userId, permission, createdAt)
              [UNIQUE(documentId, userId)]
              [CASCADE DELETE on Document or User removal]
```

Content is stored as a JSON string (Tiptap's native document format). This preserves the full document structure including formatting marks, headings, lists, images, and videos.

## What I'd Build Next (2-4 Hours)

1. **Version history** — snapshot content on save, allow viewing/restoring previous versions
2. **Real-time presence** — show who else is viewing/editing (cursor indicators)
3. **NextAuth.js integration** — proper email/password or OAuth login
4. **Media upload to S3/R2** — replace base64 storage with CDN-served images and videos
5. **Search** — full-text search across document titles and content
6. **Commenting** — inline comments with @mentions
