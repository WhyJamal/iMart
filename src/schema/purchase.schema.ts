import { z } from "zod";

export const PurchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qty: z.number({ error: "Qty must be a number" }).positive("Qty must be positive"),
  unitCost: z.number({ error: "Unit cost must be a number" }).nonnegative("Unit cost cannot be negative"),
});

export const CreatePurchaseSchema = z.object({
  supplierName: z.string().optional(),
  note: z.string().optional(),
  paymentMethod: z.enum(["card", "cash", "qr"]).default("cash"),
  items: z
    .array(PurchaseItemSchema)
    .min(1, "At least one item is required"),
});

export type PurchaseItemInput = z.infer<typeof PurchaseItemSchema>;
export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;