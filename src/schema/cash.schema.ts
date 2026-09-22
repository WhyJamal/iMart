import { z } from "zod";

export const CashMethodEnum = z.enum(["CASH", "CARD", "QR"]);

// Qo'lda kiritiladigan kassa harakatlari (savdo/xarid orqali avtomatik
// yoziladigan SALE/PURCHASE bu yerga kirmaydi — ular actions ichida
// to'g'ridan-to'g'ri recordCashFlow orqali yoziladi)
export const CreateCashFlowSchema = z.object({
  docType: z.enum(["DEPOSIT", "WITHDRAWAL", "EXPENSE", "ADJUSTMENT"]),
  direction: z.enum(["IN", "OUT"]),
  method: CashMethodEnum.default("CASH"),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be positive"),
  note: z.string().max(500).optional(),
  // undefined — serverda foydalanuvchining o'z nuqtasi olinadi;
  // null — aniq "nuqtasiz (umumiy)" tanlangan.
  pointId: z.string().min(1).nullable().optional(),
});

export type CreateCashFlowInput = z.infer<typeof CreateCashFlowSchema>;

/**
 * Nuqtalar (foyda markazlari) orasida pul o'tkazish. Umumiy kassa/bank
 * balansiga ta'sir qilmaydi (bitta OUT + bitta IN, netto nol) — faqat
 * qaysi nuqta hisobiga yozilishini o'zgartiradi. null — "nuqtasiz
 * (umumiy)" tomon.
 */
export const CreateCashTransferSchema = z
  .object({
    fromPointId: z.string().min(1).nullable(),
    toPointId: z.string().min(1).nullable(),
    method: CashMethodEnum.default("CASH"),
    amount: z
      .number({ error: "Amount must be a number" })
      .positive("Amount must be positive"),
    note: z.string().max(500).optional(),
  })
  .refine((d) => d.fromPointId !== d.toPointId, {
    message: "Manba va maqsad nuqta bir xil bo'lishi mumkin emas",
    path: ["toPointId"],
  });

export type CreateCashTransferInput = z.infer<typeof CreateCashTransferSchema>;
