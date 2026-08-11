import { z } from "zod";

export const TemplateDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().max(5).optional(),
  endTime: z.string().max(5).optional(),
  workHours: z.number().min(0).max(24),
  breakHours: z.number().min(0).max(8).default(0),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(120),
  days: z.array(TemplateDaySchema).length(7, "Hafta kunlarining barchasi to'ldirilishi shart"),
});

export const UpdateTemplateSchema = CreateTemplateSchema.extend({
  id: z.string().min(1),
});

export const CreateWorkScheduleSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart").max(120),
  year: z.number().int().min(2000).max(2100),
  templateId: z.string().min(1, "Shablon tanlanishi shart"),
  workCalendarId: z.string().min(1, "Ish kalendari tanlanishi shart"),
});

export const SetScheduleDaySchema = z.object({
  scheduleId: z.string().min(1),
  date: z.string().min(1), // "yyyy-mm-dd"
  hours: z.number().min(0).max(24),
});

export type TemplateDayInput = z.infer<typeof TemplateDaySchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type CreateWorkScheduleInput = z.infer<typeof CreateWorkScheduleSchema>;
export type SetScheduleDayInput = z.infer<typeof SetScheduleDaySchema>;
