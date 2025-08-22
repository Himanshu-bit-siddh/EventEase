"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface User {
  id: string;
  name?: string;
  email: string;
  role: "ADMIN" | "STAFF" | "OWNER";
}

interface NavBarProps {
  user?: User | null;
  onLogout?: () => void;
}

const NavBar = ({ user, onLogout }: NavBarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (response.ok) {
        onLogout?.();
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

  const navLinks = [
    { href: "/", label: "Home", public: true },
    { href: "/dashboard", label: "Dashboard", auth: true },
    { href: "/events", label: "Events", public: true },
    { href: "/admin", label: "Admin", roles: ["ADMIN"] },
  ];

  const filteredNavLinks = navLinks.filter(link => {
    if (link.public) return true;
    if (link.auth && user) return true;
    if (link.roles && user) return link.roles.includes(user.role);
    return false;
  });

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-background/95">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">EventEase</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium text-sm">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-foreground">
                      {user.name || "User"}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge
                    variant={getRoleColor(user.role) as "default" | "secondary" | "destructive"}
                    className="hidden sm:inline-flex"
                  >
                    {user.role}
                  </Badge>
                  <svg
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      isUserMenuOpen && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-background rounded-lg shadow-lg border border-border py-1 animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="text-sm font-medium text-foreground">
                        {user.name || "User"}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <Badge
                        variant={getRoleColor(user.role) as "default" | "secondary" | "destructive"}
                        className="mt-1"
                      >
                        {user.role}
                      </Badge>
                    </div>
                    
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    
                    <div className="border-t border-border mt-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-200"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Sign in
                </Button>
                <Button onClick={() => router.push("/register")}>
                  Get started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-2">
              {filteredNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 border-t border-border mt-4 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      router.push("/login");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign in
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      router.push("/register");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Get started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;


