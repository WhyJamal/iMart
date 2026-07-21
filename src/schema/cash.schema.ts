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
});

export type CreateCashFlowInput = z.infer<typeof CreateCashFlowSchema>;
