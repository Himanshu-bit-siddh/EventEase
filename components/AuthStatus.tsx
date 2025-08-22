"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type User = { id: string; email: string; role: "ADMIN" | "STAFF" | "OWNER" } | null;

export default function AuthStatus() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me").then(async (r) => {
      const data = await r.json();
      if (!mounted) return;
      setUser(data.user);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.reload();
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "STAFF":
        return "secondary";
      case "OWNER":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-muted-foreground">Loading session...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <Link href="/login">
          <Button variant="outline">
            Sign in
          </Button>
        </Link>
        <Link href="/register">
          <Button>
            Get started
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-primary font-medium text-xs">
            {user.email[0].toUpperCase()}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-foreground font-medium">{user.email}</span>
          <div className="flex items-center space-x-2 mt-1">
            <Badge
              variant={getRoleColor(user.role) as "default" | "secondary" | "destructive"}
            >
              {user.role}
            </Badge>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={logout}
      >
        Sign out
      </Button>
    </div>
  );
}


