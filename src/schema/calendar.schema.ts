import { z } from "zod";

export const CreateWorkCalendarSchema = z.object({
  year: z.number().int().min(2000).max(2100),
});

export const CalendarExceptionTypeSchema = z.enum(["HOLIDAY", "SHORT", "WORKDAY"]);

export const SetCalendarDaySchema = z.object({
  calendarId: z.string().min(1),
  date: z.string().min(1), // "yyyy-mm-dd"
  type: CalendarExceptionTypeSchema.nullable(), // null — odatiy holatga qaytarish
  title: z.string().max(120).optional(),
  shortenedBy: z.number().min(0).max(8).optional(),
});

export type CreateWorkCalendarInput = z.infer<typeof CreateWorkCalendarSchema>;
export type SetCalendarDayInput = z.infer<typeof SetCalendarDaySchema>;
