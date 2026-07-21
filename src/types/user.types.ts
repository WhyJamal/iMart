import type { Role } from "@/types/role.types";

export interface IOrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}
