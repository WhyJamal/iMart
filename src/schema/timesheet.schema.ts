import { z } from "zod";

export const CreateTimesheetSchema = z.object({
  pointId: z.string().min(1, "Nuqta tanlanishi shart"),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const SetTimesheetEntrySchema = z.object({
  timesheetId: z.string().min(1),
  userId: z.string().min(1),
  date: z.string().min(1), // "yyyy-mm-dd"
  hours: z.number().min(0).max(24),
});

export type CreateTimesheetInput = z.infer<typeof CreateTimesheetSchema>;
export type SetTimesheetEntryInput = z.infer<typeof SetTimesheetEntrySchema>;
