import { z } from "zod";

export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qty: z.number({ error: "Qty must be a number" }).positive("Qty must be positive"),
  unitPrice: z.number({ error: "Unit price must be a number" }).nonnegative("Unit price cannot be negative"),
  warehouseCellId: z.string().min(1, "Yacheyka tanlanishi shart"),
});

export const CreateSaleSchema = z
  .object({
    pointId: z.string().min(1, "Nuqta tanlanishi shart"),
    items: z.array(SaleItemSchema).min(1, "At least one item is required"),
    paymentMethod: z.enum(["card", "cash", "qr", "debt"]).default("cash"),
    totalAmount: z.number({ error: "Total must be a number" }).nonnegative("Total cannot be negative"),
    subtotal: z.number({ error: "Subtotal must be a number" }).nonnegative("Subtotal cannot be negative"),
    tipPercent: z.number({ error: "Tip must be a number" }).min(0).max(100).default(0),
    // paymentMethod === "debt" bo'lganda: mavjud mijoz tanlansa debtorId,
    // yangi mijoz kiritilsa debtorName yuboriladi (ikkalasidan biri shart).
    debtorId: z.string().optional(),
    debtorName: z.string().optional(),
  })
  .refine(
    (data) =>
      data.paymentMethod !== "debt" ||
      !!data.debtorId ||
      !!(data.debtorName && data.debtorName.trim()),
    {
      message: "Qarz uchun mijoz tanlanishi yoki ismi kiritilishi shart",
      path: ["debtorId"],
    }
  );

export type SaleItemInput = z.infer<typeof SaleItemSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;