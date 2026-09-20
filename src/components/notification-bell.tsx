"use client";

import { useEffect, useState, useTransition } from "react";
import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Megaphone, PackageX, Wallet, Info } from "lucide-react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/actions/notification-actions";
import type { INotification, NotificationType } from "@/types/notification.types";

const POLL_MS = 30_000;

const ICONS: Record<NotificationType, ElementType> = {
  ANNOUNCEMENT: Megaphone,
  LOW_STOCK: PackageX,
  DEBT_DUE: Wallet,
  GENERIC: Info,
};

function timeAgo(iso: string, justNowLabel: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return justNowLabel;
  if (min < 60) return `${min} мин`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч`;
  return `${Math.floor(hrs / 24)} д`;
}

export function NotificationBell() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, startTransition] = useTransition();

  const refresh = () => {
    getMyNotifications().then((res) => {
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    });
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleClickItem = (n: INotification) => {
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      startTransition(() => {
        markNotificationAsRead(n.id);
      });
    }

    setOpen(false);

    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnreadCount(0);
    startTransition(() => {
      markAllNotificationsAsRead();
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) refresh(); }}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-white/5 transition">
          <Bell className="w-4.5 h-4.5 text-white/70" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 min-w-3.5 h-3.5 px-0.5 flex items-center justify-center bg-indigo-500 rounded-full border-2 text-[8px] font-bold text-white leading-none"
              style={{ borderColor: "color-mix(in oklch, var(--primary) 25%, black)" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <span className="text-sm font-semibold">{t("title")}</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("empty")}
            </p>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] ?? Info;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  className="w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-muted/50 border-b border-border last:border-0"
                >
                  {n.imageUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                      <Image
                        src={n.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg shrink-0 bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      )}
                      <p className="text-sm font-medium truncate">
                        {n.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {timeAgo(n.createdAt, t("justNow"))}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
