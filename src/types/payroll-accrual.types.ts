export type SalaryType = "FIXED" | "DAILY" | "HOURLY";

export interface IPayrollAccrualSummary {
  id: string;
  pointId: string;
  pointName: string;
  year: number;
  month: number;
  status: "DRAFT" | "CONFIRMED";
  lineCount: number;
  totalPayAmount: number;
  createdAt: Date;
}

export interface IPayrollAccrualLine {
  id: string;
  userId: string;
  userName: string;
  salaryType: SalaryType;
  rate: number;
  workedUnits: number | null;
  grossAmount: number;
  alreadyPaid: number;
  bonus: number;
  deduction: number;
  payAmount: number;
  paymentMethod: string;
}

export interface IPayrollAccrualDetail {
  id: string;
  pointId: string;
  pointName: string;
  year: number;
  month: number;
  status: "DRAFT" | "CONFIRMED";
  lines: IPayrollAccrualLine[];
}
