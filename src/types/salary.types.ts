export type SalaryType = "FIXED" | "DAILY" | "HOURLY";

export interface ICurrentSalary {
  salaryType: SalaryType;
  rate: number;
  effectiveFrom: Date;
}

export interface ISalaryRegisterEntry {
  id: string;
  salaryType: SalaryType;
  rate: number;
  effectiveFrom: Date;
  reason: string | null;
  createdAt: Date;
}