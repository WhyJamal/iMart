import { z } from "zod";

export const PurchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qty: z.number({ error: "Qty must be a number" }).positive("Qty must be positive"),
  unitCost: z.number({ error: "Unit cost must be a number" }).nonnegative("Unit cost cannot be negative"),
  warehouseCellId: z.string().min(1, "Yacheyka tanlanishi shart"),
});

export const CreatePurchaseSchema = z.object({
  pointId: z.string().min(1, "Nuqta tanlanishi shart"),
  contragentId: z.string().min(1, "Sotuvchi (kontragent) tanlanishi shart"),
  note: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "QR"]).default("CASH"),
  // Xarid vaqtida haqiqatda to'langan summa. Bo'sh qoldirilsa — umumiy
  // summaga teng deb olinadi (ya'ni "to'liq to'landi"). Umumiy summadan
  // kam bo'lsa, qolgani kontragentga bo'lgan qarz sifatida saqlanadi.
  paidAmount: z
    .number({ error: "Paid amount must be a number" })
    .nonnegative("Paid amount cannot be negative")
    .optional(),
  items: z
    .array(PurchaseItemSchema)
    .min(1, "At least one item is required"),
});

export type PurchaseItemInput = z.infer<typeof PurchaseItemSchema>;
export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;