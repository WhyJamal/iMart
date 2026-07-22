import type { Role } from "@/types/role.types";
import { SalaryType } from "./salary.types";

export interface IOrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;

  salaryType: SalaryType | null;
  rate: number | null;
  effectiveFrom: Date | null;
}
