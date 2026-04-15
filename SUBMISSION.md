# Submission Checklist

## Included Materials

| Item | Location | Status |
|---|---|---|
| Source code | This repository | Complete |
| README.md | [README.md](./README.md) | Complete — includes local setup, run instructions, test commands |
| Architecture note | [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete — covers prioritization, tradeoffs, schema design |
| AI workflow note | [AI_WORKFLOW.md](./AI_WORKFLOW.md) | Complete — tools used, what was changed/rejected, verification |
| SUBMISSION.md | This file | Complete |
| Live deployment URL | _(add URL here)_ | _(pending deployment)_ |
| Walkthrough video URL | _(add URL here)_ | _(pending recording)_ |

## Test Accounts

All three accounts are pre-seeded. No signup required.

| Name | Email | Purpose |
|---|---|---|
| Alice Johnson | alice@quickdocs.demo | Primary demo user — owns the sample document |
| Bob Smith | bob@quickdocs.demo | Has shared access to Alice's welcome document |
| Charlie Davis | charlie@quickdocs.demo | No shared documents — demonstrates clean state |

## What Is Working (End-to-End)

- **Document creation** — click "New Document" from the dashboard
- **Rich-text editing** — bold, italic, underline, headings (H1-H3), bullet/numbered lists, horizontal rules
- **Image insertion** — upload images via the toolbar (PNG, JPG, GIF, WebP, max 5MB)
- **Video insertion** — upload videos via the toolbar (MP4, WebM, OGG, max 25MB) with inline playback
- **Document renaming** — click the title in the editor header
- **Auto-save** — content saves automatically after 1.5 seconds of inactivity
- **Manual save** — Save button in toolbar + Ctrl+S keyboard shortcut
- **Save status indicator** — shows Saved / Saving / Unsaved with icons
- **File import** — upload .txt, .md, or .docx files from the dashboard to create new documents
- **Document sharing** — share with any registered user by email, choose "Can edit" or "Can view"
- **Permission enforcement** — view-only users see a badge and cannot edit
- **Owned vs. shared documents** — dashboard shows separate sections
- **Export to Markdown** — downloads a .md file preserving formatting
- **Export to PDF** — opens print-ready HTML for browser Save as PDF
- **Document deletion** — owner-only, with cascade deletion of shares
- **Persistence** — all data survives page refresh
- **Automated tests** — 11 integration tests covering CRUD, sharing, and constraints

## What Is Incomplete / Would Build Next

| Feature | Status | What I'd add with 2-4 more hours |
|---|---|---|
| Real-time collaboration | Not started | Add Yjs + WebSocket for conflict-free concurrent editing |
| Version history | Not started | `DocumentVersion` table with periodic snapshots, restore UI |
| Full authentication | Simulated | Integrate NextAuth.js for email/password or OAuth |
| Media CDN storage | Base64 only | Upload images/videos to S3/R2, reference by URL to avoid DB bloat |
| Mobile responsiveness | Basic | Optimize toolbar and modals for small screens |
| Search | Not started | Full-text search across titles and content |
| Commenting | Not started | Inline comments with @mentions and resolution |

## Running Tests

```bash
npm test
```

Output:

```
 ✓ QuickDocs API Integration Tests > Document CRUD > should create a document
 ✓ QuickDocs API Integration Tests > Document CRUD > should read a document with owner info
 ✓ QuickDocs API Integration Tests > Document CRUD > should update document title and content
 ✓ QuickDocs API Integration Tests > Document CRUD > should persist document content with rich formatting
 ✓ QuickDocs API Integration Tests > Sharing > should share a document with another user
 ✓ QuickDocs API Integration Tests > Sharing > should list shared documents for a user
 ✓ QuickDocs API Integration Tests > Sharing > should separate owned and shared documents
 ✓ QuickDocs API Integration Tests > Sharing > should enforce unique share constraint
 ✓ QuickDocs API Integration Tests > Sharing > should update share permission via upsert
 ✓ QuickDocs API Integration Tests > Sharing > should remove a share
 ✓ QuickDocs API Integration Tests > Document Deletion > should cascade-delete shares when document is deleted

 Test Files  1 passed (1)
      Tests  11 passed (11)
```
