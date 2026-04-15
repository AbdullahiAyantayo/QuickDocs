"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Eye,
  Pencil,
  Check,
  X,
  Download,
  FileDown,
  FileText,
} from "lucide-react";
import Editor from "@/components/Editor";
import ShareModal from "@/components/ShareModal";

type UserData = { id: string; name: string; email: string };
type ShareData = { user: UserData; permission: string };

type DocData = {
  id: string;
  title: string;
  content: string;
  owner: UserData;
  shares: ShareData[];
  permission: string;
};

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const fetchDoc = useCallback(async () => {
    const res = await fetch(`/api/documents/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setDoc(data);
      setTitleValue(data.title);
    } else {
      setError("Document not found or access denied.");
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  useEffect(() => {
    if (!showExport) return;
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExport]);

  async function handleSave(content: string) {
    await fetch(`/api/documents/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async function handleRename() {
    if (!titleValue.trim() || titleValue === doc?.title) {
      setEditingTitle(false);
      setTitleValue(doc?.title || "");
      return;
    }
    await fetch(`/api/documents/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleValue.trim() }),
    });
    setDoc((prev) => (prev ? { ...prev, title: titleValue.trim() } : prev));
    setEditingTitle(false);
  }

  function startEditing() {
    if (doc?.permission === "view") return;
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }

  async function exportAs(format: "markdown" | "pdf") {
    setShowExport(false);
    const res = await fetch(
      `/api/documents/${params.id}/export?format=${format}`
    );
    if (!res.ok) {
      alert("Export failed");
      return;
    }

    if (format === "pdf") {
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } else {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        `${doc?.title || "document"}.md`.replace(/[^a-zA-Z0-9 .]/g, "");
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const readOnly = doc?.permission === "view";
  const isOwner = doc?.permission === "owner";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-fg">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-danger">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg hover:bg-primary-hover transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b border-border sticky top-0 z-20">
        <div className="max-w-full px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-fg hover:text-foreground"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") {
                      setEditingTitle(false);
                      setTitleValue(doc.title);
                    }
                  }}
                  className="text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none px-1 w-full max-w-md"
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  className="p-1 rounded hover:bg-success/10 text-success cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingTitle(false);
                    setTitleValue(doc.title);
                  }}
                  className="p-1 rounded hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h1
                onClick={startEditing}
                className={`text-lg font-semibold truncate ${
                  !readOnly ? "cursor-pointer hover:text-primary" : ""
                }`}
                title={readOnly ? doc.title : "Click to rename"}
              >
                {doc.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {readOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-fg font-medium">
                <Eye className="w-3 h-3" />
                View only
              </span>
            )}
            {!isOwner && !readOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-xs text-success font-medium">
                <Pencil className="w-3 h-3" />
                Can edit
              </span>
            )}

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExport(!showExport)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm cursor-pointer"
                title="Export document"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg py-1 w-48 z-50">
                  <button
                    onClick={() => exportAs("markdown")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-sm text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-muted-fg" />
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => exportAs("pdf")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-sm text-left cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-muted-fg" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowShare(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-fg hover:bg-primary-hover transition-colors text-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Editor content={doc.content} onSave={handleSave} readOnly={readOnly} />
      </main>

      {showShare && (
        <ShareModal
          docId={doc.id}
          owner={doc.owner}
          shares={doc.shares}
          isOwner={isOwner}
          onClose={() => setShowShare(false)}
          onShareAdded={fetchDoc}
        />
      )}
    </div>
  );
}
