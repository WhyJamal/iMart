import { z } from "zod";

export const WarehouseCellSchema = z.object({
  id: z.string().optional(), // mavjud bo'lsa yangilanadi, bo'lmasa yangi yaratiladi
  name: z.string().min(1, "Yacheyka nomi kiritilishi shart").max(120),
});

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1, "Sklad nomi kiritilishi shart").max(120),
  pointId: z.string().min(1, "Nuqta (point) tanlanishi shart"),
  cells: z.array(WarehouseCellSchema).default([]),
});

export const UpdateWarehouseSchema = CreateWarehouseSchema.extend({
  id: z.string().min(1),
});

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof UpdateWarehouseSchema>;
