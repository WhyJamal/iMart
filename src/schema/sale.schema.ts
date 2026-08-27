import { z } from "zod";

export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qty: z.number({ error: "Qty must be a number" }).positive("Qty must be positive"),
  unitPrice: z.number({ error: "Unit price must be a number" }).nonnegative("Unit price cannot be negative"),
  warehouseCellId: z.string().min(1, "Yacheyka tanlanishi shart"),
});

export const CreateSaleSchema = z.object({
  pointId: z.string().min(1, "Nuqta tanlanishi shart"),
  items: z.array(SaleItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(["card", "cash", "qr"]).default("cash"),
  totalAmount: z.number({ error: "Total must be a number" }).nonnegative("Total cannot be negative"),
  subtotal: z.number({ error: "Subtotal must be a number" }).nonnegative("Subtotal cannot be negative"),
  tipPercent: z.number({ error: "Tip must be a number" }).min(0).max(100).default(0)
});

export type SaleItemInput = z.infer<typeof SaleItemSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;