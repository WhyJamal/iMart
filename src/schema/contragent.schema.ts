import { z } from "zod";

export const CreateContragentSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(120),
  phone: z.string().max(30).optional(),
  inn: z.string().max(12).optional(),
  type: z.enum(["SUPPLIER", "BUYER"]).default("SUPPLIER"),
});

export const UpdateContragentSchema = CreateContragentSchema.extend({
  id: z.string().min(1),
});

export type CreateContragentInput = z.infer<typeof CreateContragentSchema>;
export type UpdateContragentInput = z.infer<typeof UpdateContragentSchema>;
