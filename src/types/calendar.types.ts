export type CalendarExceptionType = "HOLIDAY" | "SHORT" | "WORKDAY";

export interface ICalendarDayException {
  date: string; // "yyyy-mm-dd"
  type: CalendarExceptionType;
  title?: string | null;
  shortenedBy?: number | null;
}

export interface IWorkCalendarSummary {
  id: string;
  year: number;
  name: string;
  isConfirmed: boolean;
  confirmedAt: Date | null;
  exceptionsCount: number;
}

export interface IWorkCalendarDetail {
  id: string;
  year: number;
  name: string;
  isConfirmed: boolean;
  confirmedAt: Date | null;
  exceptions: ICalendarDayException[];
}

// Bitta kunning grid'da chizish uchun hisoblangan (default qoida +
// istisno) yakuniy holati.
export type ResolvedDayKind =
  | "workday" // odatiy ish kuni (Dush-Juma)
  | "weekend" // odatiy dam olish kuni (Shanba-Yakshanba)
  | "holiday" // bayram / alohida dam olish kuni
  | "short" // qisqartirilgan (predprazdnichniy) ish kuni
  | "moved-workday"; // dam olish kuni ish kuniga ko'chirilgan

export interface IResolvedDay {
  date: string;
  kind: ResolvedDayKind;
  title?: string | null;
  shortenedBy?: number | null;
}
