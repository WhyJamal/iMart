import { z } from "zod";

export const WriteOffItemSchema = z.object({
  warehouseCellId: z.string().min(1, "Warehouse cell is required"),
  productId: z.string().min(1, "Product is required"),
  qty: z
    .number({ error: "Qty must be a number" })
    .positive("Qty must be positive"),
  unitCost: z
    .number({ error: "Unit cost must be a number" })
    .nonnegative("Unit cost cannot be negative"),
});

export const CreateWriteOffSchema = z.object({
  pointId: z.string().min(1, "Point is required"),
  reason: z.string().max(500).optional(),
  items: z.array(WriteOffItemSchema).min(1, "At least one item is required"),
});

export type WriteOffItemInput = z.infer<typeof WriteOffItemSchema>;
export type CreateWriteOffInput = z.infer<typeof CreateWriteOffSchema>;
