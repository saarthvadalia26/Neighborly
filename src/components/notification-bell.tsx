"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Check, CheckCheck, Coins, MessageSquare, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import type { Database } from "@/lib/database.types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationBell({ userId }: { userId: string }) {
  const supabase = useRef(createClient()).current;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // --- Initial load ---
  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });
  }, [supabase, userId]);

  // --- Real-time subscription ---
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // --- Close on outside click ---
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // --- Mark single notification as read ---
  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    },
    [supabase],
  );

  // --- Mark all as read ---
  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  }, [supabase, notifications]);

  const typeIcon = (type: string) =>
    type === "credit_transfer" ? (
      <Coins className="size-4 shrink-0 text-amber-500" />
    ) : (
      <MessageSquare className="size-4 shrink-0 text-blue-500" />
    );

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative flex size-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {unreadCount > 0 ? (
          <BellRing className="size-4" />
        ) : (
          <Bell className="size-4" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border bg-popover shadow-xl sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllRead}
                    className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                  className="size-7 text-muted-foreground"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    You&apos;re all caught up!
                  </p>
                </div>
              ) : (
                <ul>
                  {notifications.map((notif) => (
                    <motion.li
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`group relative border-b last:border-b-0 transition-colors ${
                        notif.is_read ? "bg-background" : "bg-blue-50/40 dark:bg-blue-950/20"
                      }`}
                    >
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div className="mt-0.5">{typeIcon(notif.type)}</div>
                        <div className="min-w-0 flex-1">
                          {notif.related_post_id ? (
                            <Link
                              href={`/dashboard/post/${notif.related_post_id}`}
                              onClick={() => {
                                markAsRead(notif.id);
                                setOpen(false);
                              }}
                              className="text-sm leading-snug hover:underline"
                            >
                              {notif.message}
                            </Link>
                          ) : (
                            <p className="text-sm leading-snug">{notif.message}</p>
                          )}
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {timeAgo(notif.created_at)}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            title="Mark as read"
                            className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Check className="size-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
