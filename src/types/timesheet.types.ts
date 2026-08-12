export interface ITimesheetSummary {
  id: string;
  pointId: string;
  pointName: string;
  year: number;
  month: number;
  status: "DRAFT" | "CONFIRMED";
  userCount: number;
  createdAt: Date;
}

export interface ITimesheetEntry {
  userId: string;
  date: string; // "yyyy-mm-dd"
  hours: number;
  dayKind: string;
  isManual: boolean;
}

export interface ITimesheetUserRow {
  userId: string;
  userName: string;
  workScheduleName: string | null;
  totalHours: number;
  totalDays: number;
}

export interface ITimesheetDetail {
  id: string;
  pointId: string;
  pointName: string;
  year: number;
  month: number;
  status: "DRAFT" | "CONFIRMED";
  users: ITimesheetUserRow[];
  entries: ITimesheetEntry[];
}
