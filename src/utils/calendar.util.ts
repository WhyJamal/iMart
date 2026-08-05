import type {
  ICalendarDayException,
  IResolvedDay,
  ResolvedDayKind,
} from "@/types/calendar.types";

/**
 * Standart qoida (Dush-Juma — ish kuni, Shanba-Yakshanba — dam olish)
 * + istisnolar (bayram, ko'chirilgan kun, qisqa kun) asosida yilning
 * har bir kuni uchun yakuniy holatni hisoblaydi.
 */
export function resolveYearDays(
  year: number,
  exceptions: ICalendarDayException[]
): IResolvedDay[] {
  const exceptionMap = new Map(exceptions.map((e) => [e.date, e]));
  const days: IResolvedDay[] = [];

  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year, 11, 31);

  for (let t = start; t <= end; t += 86_400_000) {
    const d = new Date(t);
    const iso = d.toISOString().slice(0, 10);
    const weekday = d.getUTCDay(); // 0 = Yakshanba, 6 = Shanba
    const exception = exceptionMap.get(iso);

    let kind: ResolvedDayKind;
    if (exception) {
      if (exception.type === "HOLIDAY") kind = "holiday";
      else if (exception.type === "SHORT") kind = "short";
      else kind = "moved-workday";
    } else {
      kind = weekday === 0 || weekday === 6 ? "weekend" : "workday";
    }

    days.push({
      date: iso,
      kind,
      title: exception?.title ?? null,
      shortenedBy: exception?.shortenedBy ?? null,
    });
  }

  return days;
}

export function groupByMonth(days: IResolvedDay[]): IResolvedDay[][] {
  const months: IResolvedDay[][] = Array.from({ length: 12 }, () => []);
  for (const day of days) {
    const month = Number(day.date.slice(5, 7)) - 1;
    months[month].push(day);
  }
  return months;
}

export interface ICalendarCounts {
  workingDays: number;
  holidays: number;
  weekends: number;
}

// Bu yerda faqat KUNLAR soni hisoblanadi — soatlar emas. Har bir kun
// necha soat ekanligi xodimga biriktirilgan "Grafik работы"
// spravochnigidan aniqlanadi (keyingi bosqich); kalendar faqat kun
// toifasini (ish/dam/bayram/qisqa) beradi.
export function countCalendarDays(days: IResolvedDay[]): ICalendarCounts {
  let workingDays = 0;
  let holidays = 0;
  let weekends = 0;

  for (const d of days) {
    if (d.kind === "workday" || d.kind === "moved-workday" || d.kind === "short") {
      workingDays++;
    } else if (d.kind === "holiday") {
      holidays++;
    } else {
      weekends++;
    }
  }

  return { workingDays, holidays, weekends };
}

export const MONTH_NAMES_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

export const WEEKDAY_LABELS_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
