"use client";

import { useState } from "react";
import { X, UserPlus, Trash2, Crown, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";

type ShareUser = {
  user: { id: string; name: string; email: string };
  permission: string;
};

type ShareModalProps = {
  docId: string;
  owner: { id: string; name: string; email: string };
  shares: ShareUser[];
  isOwner: boolean;
  onClose: () => void;
  onShareAdded: () => void;
};

export default function ShareModal({
  docId,
  owner,
  shares,
  isOwner,
  onClose,
  onShareAdded,
}: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("edit");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), permission }),
    });

    if (res.ok) {
      setEmail("");
      onShareAdded();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to share");
    }
    setLoading(false);
  }

  async function handleRemoveShare(userId: string) {
    await fetch(`/api/documents/${docId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    onShareAdded();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl border border-border w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">Share Document</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {isOwner && (
            <form onSubmit={handleShare} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                >
                  <option value="edit">Can edit</option>
                  <option value="view">Can view</option>
                </select>
              </div>
              {error && (
                <p className="text-danger text-xs mt-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className={cn(
                  "mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-fg hover:bg-primary-hover transition-colors text-sm font-medium cursor-pointer",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <UserPlus className="w-4 h-4" />
                {loading ? "Sharing..." : "Share"}
              </button>
            </form>
          )}

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">
              People with access
            </h3>

            <div className="flex items-center gap-3 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{owner.name}</div>
                <div className="text-xs text-muted-fg truncate">{owner.email}</div>
              </div>
              <span className="text-xs text-muted-fg font-medium">Owner</span>
            </div>

            {shares.map((share) => (
              <div
                key={share.user.id}
                className="flex items-center gap-3 p-2 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  {share.permission === "edit" ? (
                    <Pencil className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-muted-fg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {share.user.name}
                  </div>
                  <div className="text-xs text-muted-fg truncate">
                    {share.user.email}
                  </div>
                </div>
                <span className="text-xs text-muted-fg capitalize">
                  {share.permission}
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveShare(share.user.id)}
                    className="p-1 rounded hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
                    title="Remove access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {shares.length === 0 && (
              <p className="text-xs text-muted-fg py-2 text-center">
                Not shared with anyone yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
