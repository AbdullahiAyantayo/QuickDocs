"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Upload,
  LogOut,
  Trash2,
  Users,
  Clock,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/cn";

type UserData = {
  id: string;
  name: string;
  email: string;
};

type DocData = {
  id: string;
  title: string;
  updatedAt: string;
  owner: UserData;
  shares: { user: UserData; permission: string }[];
};

export default function Dashboard({
  currentUser,
  onLogout,
}: {
  currentUser: UserData;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [owned, setOwned] = useState<DocData[]>([]);
  const [shared, setShared] = useState<DocData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setOwned(data.owned);
      setShared(data.shared);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function createDoc() {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const doc = await res.json();
      router.push(`/editor/${doc.id}`);
    }
  }

  async function deleteDoc(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this document? This cannot be undone.")) return;

    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    fetchDocs();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const doc = await res.json();
      router.push(`/editor/${doc.id}`);
    } else {
      const err = await res.json();
      alert(err.error || "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-fg font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-lg">QuickDocs</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-fg hidden sm:block">
              {currentUser.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-fg hover:text-foreground cursor-pointer"
              title="Switch account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Documents</h2>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.docx"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border",
                "hover:bg-muted transition-colors text-sm font-medium cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Import File"}
            </button>
            <button
              onClick={createDoc}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg hover:bg-primary-hover transition-colors text-sm font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-fg">Loading documents...</div>
        ) : (
          <>
            {owned.length > 0 ? (
              <div className="grid gap-3 mb-8">
                {owned.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/editor/${doc.id}`)}
                    className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-fg">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(doc.updatedAt)}
                            </span>
                            {doc.shares.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Shared with {doc.shares.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteDoc(doc.id, e)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-8 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <FileText className="w-10 h-10 text-muted-fg/40 mx-auto mb-3" />
                <p className="text-sm text-muted-fg mb-4">
                  You haven&apos;t created any documents yet.
                </p>
                <button
                  onClick={createDoc}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg hover:bg-primary-hover transition-colors text-sm font-medium cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Document
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-4 h-4 text-muted-fg" />
              <h2 className="text-xl font-semibold">Shared with Me</h2>
            </div>

            {shared.length > 0 ? (
              <div className="grid gap-3">
                {shared.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/editor/${doc.id}`)}
                    className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium truncate">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-fg">
                          <span>by {doc.owner.name}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(doc.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                <Users className="w-8 h-8 text-muted-fg/40 mx-auto mb-2" />
                <p className="text-sm text-muted-fg">
                  No documents have been shared with you yet.
                </p>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center text-xs text-muted-fg">
          Supported import formats: <strong>.txt</strong>, <strong>.md</strong>, and <strong>.docx</strong> (max 10MB)
        </div>
      </main>
    </div>
  );
}
