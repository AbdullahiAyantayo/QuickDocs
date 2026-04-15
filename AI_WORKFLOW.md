# AI Workflow Note

## Tools Used

- **Cursor (Claude)** — primary development tool for code generation, refactoring, and architecture decisions
- **GitHub Copilot** — inline autocomplete during manual editing

## Where AI Materially Sped Up Work

1. **Project scaffolding**: Generated the initial Next.js + Prisma + Tiptap project structure, saving ~30 minutes of boilerplate setup and dependency research.

2. **API route patterns**: Generated the CRUD endpoints for documents and sharing, including the access-control logic (`canAccess` function), which I then reviewed and refined for edge cases.

3. **Tiptap editor configuration**: AI generated the toolbar component with all the formatting buttons wired to Tiptap's chain API. This saved significant time referencing the Tiptap documentation for each extension's command syntax.

4. **File format conversion**: The Markdown → Tiptap JSON parser, DOCX → Tiptap conversion (via Mammoth), and the Tiptap JSON → Markdown/HTML export logic were all scaffolded by AI. These are tedious string-transformation functions where AI excels.

5. **Prisma schema design**: The three-model schema with cascade deletes and compound unique constraints was generated in one pass, which I validated against the requirements.

6. **Test suite**: AI generated the integration test structure covering CRUD, sharing permissions, cascade deletion, and constraint enforcement, which I reviewed for correctness and completeness.

## What I Changed or Rejected

1. **Prisma 7 adapter pattern**: AI initially generated Prisma 7 configuration with the new ESM-only client and driver adapters. This caused compatibility issues with Next.js Turbopack. I made the judgment call to downgrade to Prisma 5 for reliability — the generated client works seamlessly with Next.js bundling.

2. **Complex DOCX parser**: AI suggested building a full HTML-to-Tiptap conversion that handled nested lists, tables, and complex formatting. I simplified this to handle the common cases (headings, paragraphs, bold/italic/underline) since edge-case coverage wasn't worth the time investment for a demo.

3. **Shadcn/UI component library**: AI recommended installing shadcn/ui for buttons, dialogs, etc. I opted against it — the handful of components in this app are simple enough that raw Tailwind + a `cn()` utility keeps things lighter and more readable.

4. **Server-side PDF generation**: AI suggested Puppeteer or jsPDF for PDF export. I rejected this because it would require a headless browser dependency in production, adding significant deployment complexity. Browser-native Print → Save as PDF is more reliable and zero-infrastructure.

5. **Base64 image storage**: AI suggested uploading images to the filesystem and serving via a static route. For this scope, base64 data URLs embedded in the document JSON are the right tradeoff — no file storage infrastructure, and images survive database backup/restore. I documented the production alternative (S3/R2) in the architecture note.

## How I Verified Correctness

1. **Manual testing**: Ran through the full user flow — login, create document, edit with formatting, rename, share with another user, switch accounts, verify shared access, file upload (.txt, .md), export to Markdown and PDF.

2. **Automated tests**: 11 integration tests run against the real SQLite database, covering:
   - Document creation with content
   - Reading documents with owner/share relations
   - Updating title and content
   - Rich-text content persistence (bold, italic, lists survive save/reload)
   - Sharing, permission updates, and share removal
   - Unique constraint enforcement
   - Cascade deletion behavior

3. **API response verification**: Checked all API endpoints return correct status codes (200, 201, 400, 401, 403, 404) and error messages for each failure mode.

4. **Editor behavior**: Verified auto-save fires after editing stops, manual save works via button and Ctrl+S, and the save status indicator transitions correctly between Saved → Unsaved → Saving → Saved.

5. **UX review**: Tested the sharing modal, export dropdown, image insertion, and YouTube embedding to ensure they work end-to-end without console errors.
