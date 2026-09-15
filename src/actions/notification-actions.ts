"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import type { ActionResult } from "@/types/action-result.types";
import type { INotification, NotificationType } from "@/types/notification.types";

const MAX_LIST = 30;

function toDTO(n: {
  id: string;
  type: string;
  title: string;
  message: string;
  imageUrl: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): INotification {
  return {
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    imageUrl: n.imageUrl,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

// ─── O'qish ─────────────────────────────────────────────────────────────────

export async function getMyNotifications(): Promise<{
  items: INotification[];
  unreadCount: number;
}> {
  const session = await getServerSession();
  if (!session || !session.userId) return { items: [], unreadCount: 0 };

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId, organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      take: MAX_LIST,
    }),
    prisma.notification.count({
      where: {
        userId: session.userId,
        organizationId: session.organizationId,
        isRead: false,
      },
    }),
  ]);

  return { items: rows.map(toDTO), unreadCount };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await getServerSession();
  if (!session || !session.userId) return 0;

  return prisma.notification.count({
    where: {
      userId: session.userId,
      organizationId: session.organizationId,
      isRead: false,
    },
  });
}

// ─── O'qilgan deb belgilash ─────────────────────────────────────────────────

export async function markNotificationAsRead(
  id: string
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session || !session.userId) return { success: false, error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id, userId: session.userId, organizationId: session.organizationId },
    data: { isRead: true },
  });

  return { success: true, data: undefined };
}

export async function markAllNotificationsAsRead(): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session || !session.userId) return { success: false, error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { userId: session.userId, organizationId: session.organizationId, isRead: false },
    data: { isRead: true },
  });

  return { success: true, data: undefined };
}

// ─── Yaratish (ichki yordamchi) ─────────────────────────────────────────────
//
// notifyUsers — kelajakda har qanday feature (low-stock, debt-due va h.k.)
// shu funksiyani chaqirib, bitta yoki bir nechta foydalanuvchiga xabar
// yuborishi mumkin. Bu "use server" fayl ichida, lekin public UI'dan
// to'g'ridan-to'g'ri chaqirilishi nazarda tutilmagan — boshqa server
// action/skript ichidan import qilib ishlatiladi (masalan
// stock-actions.ts'dan qoldiq kam bo'lganda).
export async function notifyUsers(input: {
  organizationId: string;
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;
  link?: string;
}): Promise<void> {
  if (input.userIds.length === 0) return;

  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      organizationId: input.organizationId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      imageUrl: input.imageUrl,
      link: input.link,
    })),
  });
}

// ─── E'lon yuborish (OWNER/ADMIN) ───────────────────────────────────────────
//
// broadcastAnnouncement — "dasturga o'zgartirish kiritildi, ko'rib
// chiqing" turidagi xabarlarni, ixtiyoriy rasm va havola bilan, shu
// tashkilotning BARCHA faol xodimlariga yuboradi.
export async function broadcastAnnouncement(input: {
  title: string;
  message: string;
  imageUrl?: string;
  link?: string;
}): Promise<ActionResult> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "notifications:broadcast");
    if (denied) return denied;

    if (!input.title.trim() || !input.message.trim()) {
      return { success: false, error: "Sarlavha va matn kiritilishi shart" };
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: session.organizationId },
      select: { userId: true },
    });

    await notifyUsers({
      organizationId: session.organizationId,
      userIds: members.map((m: { userId: string }) => m.userId),
      type: "ANNOUNCEMENT",
      title: input.title.trim(),
      message: input.message.trim(),
      imageUrl: input.imageUrl?.trim() || undefined,
      link: input.link?.trim() || undefined,
    });

    revalidatePath("/");

    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "E'lon yuborishda xatolik yuz berdi." };
  }
}
