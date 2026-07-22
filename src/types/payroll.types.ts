import type { SalaryType } from "./salary.types";

export interface IPayrollPayment {
  id: string;
  userId: string;
  userName: string;
  periodStart: Date;
  periodEnd: Date;
  salaryType: SalaryType;
  rate: number;
  workedUnits: number | null;
  bonus: number;
  deduction: number;
  totalAmount: number;
  paymentMethod: string;
  note: string | null;
  createdAt: Date;
}
