import { z } from "zod";

export const SalaryTypeEnum = z.enum(["FIXED", "DAILY", "HOURLY"]);

export const SetSalaryRateSchema = z.object({
  userId: z.string().min(1, "Xodim tanlanishi shart"),
  salaryType: SalaryTypeEnum,
  rate: z.number({ error: "Stavka son bo'lishi kerak" }).positive("Stavka musbat bo'lishi kerak"),
  effectiveFrom: z.coerce.date(),
  reason: z.string().max(300).optional(),
});

export const CreatePayrollPaymentSchema = z.object({
  userId: z.string().min(1, "Xodim tanlanishi shart"),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  workedUnits: z.number().nonnegative().optional(), // FIXED bo'lsa yuborilmaydi
  bonus: z.number().nonnegative().default(0),
  deduction: z.number().nonnegative().default(0),
  paymentMethod: z.enum(["cash", "card"]).default("cash"),
  note: z.string().max(500).optional(),
}).refine((data) => data.periodEnd >= data.periodStart, {
  message: "Davr oxiri boshidan keyin bo'lishi kerak",
  path: ["periodEnd"],
});

export type SetSalaryRateInput = z.infer<typeof SetSalaryRateSchema>;
export type CreatePayrollPaymentInput = z.infer<typeof CreatePayrollPaymentSchema>;
