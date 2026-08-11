import type { Role } from "@/types/role.types";
import { SalaryType } from "./salary.types";

export interface IOrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;

  pointId: string | null;
  pointName: string | null;
  workScheduleId: string | null;

  salaryType: SalaryType | null;
  rate: number | null;
  effectiveFrom: Date | null;
}
