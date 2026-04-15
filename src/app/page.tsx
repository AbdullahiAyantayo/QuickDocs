"use client";

import { useEffect, useState } from "react";
import UserPicker from "@/components/UserPicker";
import Dashboard from "@/components/Dashboard";

type UserData = {
  id: string;
  name: string;
  email: string;
};

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-fg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <UserPicker onLogin={setUser} />;
  }

  return <Dashboard currentUser={user} onLogout={() => setUser(null)} />;
}
