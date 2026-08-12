import { z } from "zod";

export const CreatePayrollAccrualSchema = z.object({
  pointId: z.string().min(1, "Nuqta tanlanishi shart"),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const UpdateAccrualLineSchema = z.object({
  lineId: z.string().min(1),
  payAmount: z.number().min(0),
  bonus: z.number().min(0).optional(),
  deduction: z.number().min(0).optional(),
  paymentMethod: z.enum(["cash", "card"]).optional(),
});

export type CreatePayrollAccrualInput = z.infer<typeof CreatePayrollAccrualSchema>;
export type UpdateAccrualLineInput = z.infer<typeof UpdateAccrualLineSchema>;
