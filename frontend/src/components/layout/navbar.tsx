"use client";

import { SignedIn, SignedOut, useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "../ui/button";
import { Bell, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Notification } from "@/types/notification";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { getToken, userId } = useAuth();
  const { socket } = useSocket();
  const { unreadCount, setUnreadCount, incrementUnread } = useNotificationCount();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  useEffect(() => {
    async function loadUnread() {
      if (!userId) return setUnreadCount(0);
      try {
        const data = await apiGet<Notification[]>(apiClient, "/api/notifications?unreadOnly=true");
        setUnreadCount(data.length);
      } catch {}
    }
    loadUnread();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => incrementUnread();
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [socket, incrementUnread]);

  const links = [
    { href: "/chat", label: "Chat" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl h-16 items-center justify-between px-4 md:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Threadify
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition text-xs text-muted-foreground">
            Discuss • Share • Connect
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {links.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-full text-sm font-medium transition hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">

          <ThemeToggle />

          <SignedIn>
            <Link href="/notifications">
              <Button size="icon" variant="ghost" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <Link href="/sign-in">
              <Button className="rounded-full">Sign In</Button>
            </Link>
          </SignedOut>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden border rounded-full h-9 w-9 flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-4" /> : <Menu className="w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background/80 backdrop-blur-sm">
          <nav className="flex flex-col px-4 py-2">
            {links.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
