import { z } from "zod";

export const PurchaseReturnItemSchema = z.object({
  purchaseItemId: z.string().min(1, "Purchase item is required"),
  qty: z
    .number({ error: "Qty must be a number" })
    .positive("Qty must be positive"),
  unitCost: z
    .number({ error: "Unit cost must be a number" })
    .nonnegative("Unit cost cannot be negative"),
});

export const CreatePurchaseReturnSchema = z.object({
  purchaseId: z.string().min(1, "Purchase is required"),
  reason: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "card", "qr"]).default("cash"),
  items: z
    .array(PurchaseReturnItemSchema)
    .min(1, "At least one item is required"),
});

export type PurchaseReturnItemInput = z.infer<typeof PurchaseReturnItemSchema>;
export type CreatePurchaseReturnInput = z.infer<
  typeof CreatePurchaseReturnSchema
>;
