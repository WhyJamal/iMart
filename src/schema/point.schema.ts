import { z } from "zod";

export const CreatePointSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(120),
});

export const UpdatePointSchema = CreatePointSchema.extend({
  id: z.string().min(1),
});

export type CreatePointInput = z.infer<typeof CreatePointSchema>;
export type UpdatePointInput = z.infer<typeof UpdatePointSchema>;
