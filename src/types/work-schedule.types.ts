export interface ITemplateDay {
  dayOfWeek: number; // 1=Dushanba ... 7=Yakshanba
  startTime: string | null;
  endTime: string | null;
  workHours: number;
  breakHours: number;
}

export interface IWorkScheduleTemplate {
  id: string;
  name: string;
  days: ITemplateDay[];
  scheduleCount: number;
  createdAt: Date;
}

export interface IWorkScheduleTemplateOption {
  id: string;
  name: string;
}

export interface IScheduleDay {
  date: string; // "yyyy-mm-dd"
  hours: number;
  dayKind: string; // ResolvedDayKind
  isManual: boolean;
}

export interface IWorkScheduleSummary {
  id: string;
  name: string;
  year: number;
  templateId: string;
  templateName: string;
  userCount: number;
  filledDaysCount: number;
  createdAt: Date;
}

export interface IWorkScheduleDetail {
  id: string;
  name: string;
  year: number;
  templateId: string;
  workCalendarId: string | null;
  days: IScheduleDay[];
}

export interface IWorkScheduleOption {
  id: string;
  name: string;
  year: number;
}
