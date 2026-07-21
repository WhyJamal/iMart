import { z } from "zod";

export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qty: z.number({ error: "Qty must be a number" }).positive("Qty must be positive"),
  unitPrice: z.number({ error: "Unit price must be a number" }).nonnegative("Unit price cannot be negative"),
});

export const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(["card", "cash", "qr"]).default("cash"),
  totalAmount: z.number({ error: "Unit price must be a number" }).nonnegative("Unit price cannot be negative")
});

export type SaleItemInput = z.infer<typeof SaleItemSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;