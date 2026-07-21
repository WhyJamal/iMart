import type { DefaultSession } from "next-auth";
import { Role } from "./role.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      role: Role;
    } & DefaultSession["user"];
  }
}