# QuickDocs — Collaborative Document Editor

A lightweight collaborative document editor built with Next.js, Tiptap, and Prisma. QuickDocs supports rich-text editing, file import (.txt, .md, .docx), image and video embedding, document sharing with permission levels, and export to Markdown and PDF.

## Live Demo

> **Deployed URL**: _(add your Vercel deployment URL here)_
>
> **Test accounts** (pre-seeded):
> | Name | Email |
> |---|---|
> | Alice Johnson | alice@quickdocs.demo |
> | Bob Smith | bob@quickdocs.demo |
> | Charlie Davis | charlie@quickdocs.demo |
>
> Log in as Alice, create a document, then share it with Bob using his email. Switch to Bob's account to see the shared document.

## Quick Start (Local Development)

### Prerequisites

- **Node.js** 20+ (tested on 22.x)
- **npm** 10+
- **PostgreSQL** database (free tier from [Neon](https://neon.tech) works great)

### Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd QuickDocs
npm install

# 2. Set your database connection string
cp .env.example .env
# Edit .env with your Postgres connection string

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed demo users and a sample document
npm run db:seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
npm test
```

Runs 11 integration tests covering document CRUD, rich-text persistence, sharing with permissions, cascade deletion, and constraint enforcement.

## Deploying to Vercel

### 1. Create a Neon Database (free)

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

### 2. Deploy to Vercel

1. Push your code to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add the environment variable:
   - `DATABASE_URL` = your Neon connection string
4. Deploy — the build command (`prisma generate && next build`) runs automatically

### 3. Initialize the Database

After the first deploy, run migrations and seed from your local machine:

```bash
# Set your Neon DATABASE_URL locally in .env, then:
npx prisma migrate deploy
npm run db:seed
```

Your app is now live with demo data.

## Features

### Document Editing
- Rich-text editor powered by **Tiptap** (ProseMirror)
- **Bold**, **Italic**, **Underline** formatting
- Headings (H1, H2, H3)
- Bullet lists and numbered lists
- Horizontal rules
- **Image insertion** — upload PNG, JPG, GIF, or WebP (max 5MB) directly into documents
- **Video insertion** — upload MP4, WebM, or OGG (max 25MB) with inline playback
- **Auto-save** with 1.5s debounce + **manual save** button (Ctrl+S)
- Undo/Redo support

### File Import
Upload a file from the dashboard to create a new editable document:
- **.txt** — imported as plain text paragraphs
- **.md** — parsed with heading, bold, italic, underline, and code detection
- **.docx** — converted via Mammoth.js, preserving headings and basic formatting

File size limit: **10MB**. Clearly stated in the UI.

### Sharing
- Every document has an **owner**
- Share with any registered user by email
- Permission levels: **Can edit** or **Can view**
- Dashboard shows **My Documents** and **Shared with Me** sections
- View-only users see a badge and cannot edit content or rename
- Only the owner can share, modify permissions, or delete

### Export
- **Export to Markdown** — downloads a `.md` file with headings, bold/italic, lists, and image references preserved
- **Export to PDF** — opens a print-ready HTML view in a new tab; use the browser's Print → Save as PDF

### Persistence
- All data stored in **PostgreSQL** via **Prisma ORM** (Neon free tier for deployment)
- Documents survive page refresh with formatting intact
- Sharing state is persisted and immediately visible

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Unified frontend + API, fast Turbopack dev, Vercel deployment |
| Editor | Tiptap 3 (ProseMirror) | Production-grade rich text, JSON document model, extensible |
| Database | PostgreSQL + Prisma 5 | Production-ready, type-safe ORM, free Neon hosting |
| Styling | Tailwind CSS 4 | Utility-first, rapid iteration, tiny bundle |
| Icons | Lucide React | Tree-shakable, consistent icon set |
| DOCX parsing | Mammoth.js | Robust .docx to HTML conversion |
| Testing | Vitest | Fast, native ESM, Jest-compatible API |
| Deployment | Vercel + Neon | Zero-config deployment, serverless Postgres |

## Project Structure

```
QuickDocs/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Document, DocumentShare)
│   ├── seed.ts                # Seeds 3 demo users + a sample shared document
│   └── migrations/            # PostgreSQL migration files
├── src/
│   ├── app/
│   │   ├── page.tsx           # Login screen + dashboard
│   │   ├── editor/[id]/       # Document editor page
│   │   ├── api/
│   │   │   ├── auth/          # Login/logout (cookie-based mock auth)
│   │   │   ├── users/         # List all users
│   │   │   ├── documents/     # CRUD, sharing, export endpoints
│   │   │   └── upload/        # File import (.txt, .md, .docx)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Editor.tsx         # Tiptap editor with toolbar
│   │   ├── Dashboard.tsx      # Document list (owned + shared)
│   │   ├── ShareModal.tsx     # Share dialog with permission picker
│   │   └── UserPicker.tsx     # Demo account selector
│   └── lib/
│       ├── prisma.ts          # Prisma singleton
│       ├── auth.ts            # Cookie-based auth helpers
│       ├── cn.ts              # Tailwind classname utility
│       └── video-extension.ts # Custom Tiptap video node
├── ARCHITECTURE.md
├── AI_WORKFLOW.md
├── SUBMISSION.md
└── README.md
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset database and re-seed |
