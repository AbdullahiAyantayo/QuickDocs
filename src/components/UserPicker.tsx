"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
};

export default function UserPicker({
  onLogin,
}: {
  onLogin: (user: UserData) => void;
}) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  async function handleSelect(userId: string) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.user) {
      onLogin(data.user);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-fg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-fg font-bold text-lg">Q</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">QuickDocs</h1>
          </div>
          <p className="text-muted-fg">
            Choose an account to get started
          </p>
        </div>

        <div className="bg-background rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/50">
            <h2 className="font-semibold text-sm text-muted-fg uppercase tracking-wider">
              Demo Accounts
            </h2>
          </div>
          <div className="divide-y divide-border">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-fg">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-fg text-center mt-4">
          These are pre-seeded demo accounts for testing the sharing workflow.
        </p>
      </div>
    </div>
  );
}
