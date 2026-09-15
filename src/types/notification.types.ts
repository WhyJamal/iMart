// NotificationType — String + TS union pattern (Role kabi). Yangi tur
// qo'shish uchun faqat shu massivga yozish kifoya, migratsiya kerak emas.
export const NOTIFICATION_TYPES = [
  "ANNOUNCEMENT", // dasturga o'zgartirish/yangilanish haqida xabar (rasm + havola bilan)
  "LOW_STOCK", // mahsulot qoldig'i kam qolganda (hozircha trigger ulanmagan — pastga qarang)
  "DEBT_DUE", // qarzdorlik muddati yaqinlashganda/o'tganda (hozircha trigger ulanmagan)
  "GENERIC", // umumiy, aniq turga kirmaydigan xabarlar uchun
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  imageUrl: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
