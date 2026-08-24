import { z } from "zod";

export const TransferItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  fromCellId: z.string().min(1, "Source cell is required"),
  toCellId: z.string().min(1, "Destination cell is required"),
  qty: z.number({ error: "Qty must be a number" }).positive("Qty must be positive"),
  unitCost: z.number({ error: "Transfer price must be a number" }).nonnegative("Transfer price cannot be negative"),
});

export const CreateTransferSchema = z.object({
  fromPointId: z.string().min(1, "Source point is required"),
  toPointId: z.string().min(1, "Destination point is required"),
  note: z.string().max(500).optional(),
  items: z.array(TransferItemSchema).min(1, "At least one item is required"),
});

export type TransferItemInput = z.infer<typeof TransferItemSchema>;
export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;
