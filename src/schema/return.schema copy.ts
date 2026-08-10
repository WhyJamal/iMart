import { z } from "zod";

export const SaleReturnItemSchema = z.object({
  saleItemId: z.string().min(1, "Sale item is required"),
  qty: z
    .number({ error: "Qty must be a number" })
    .positive("Qty must be positive"),
  unitPrice: z
    .number({ error: "Unit price must be a number" })
    .nonnegative("Unit price cannot be negative"),
});

export const CreateSaleReturnSchema = z.object({
  saleId: z.string().min(1, "Sale is required"),
  reason: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "card", "qr"]).default("cash"),
  items: z.array(SaleReturnItemSchema).min(1, "At least one item is required"),
});

export type SaleReturnItemInput = z.infer<typeof SaleReturnItemSchema>;
export type CreateSaleReturnInput = z.infer<typeof CreateSaleReturnSchema>;
