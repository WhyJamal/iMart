import { getRequestConfig } from "next-intl/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";

const NAMESPACES = [
  "common", "header", "sidebar", "dashboard", "pos-terminal", 
  "purchase", "sales", "cash", "point", "contragent", "users",
  "calendar", "work-schedules", "timesheet", "salary", "payroll",
  "warehouse", "product", "promotion", "transfer", "write-off",
  "purchase-return", "sale-return", "profile", "auth", "onboarding",
  "material-report"
] as const;

export default getRequestConfig(async () => {
  const session = await auth();
  let locale = session?.user?.locale ?? (await cookies()).get("NEXT_LOCALE")?.value;
  if (!locale || !["en", "ru", "uz"].includes(locale)) locale = "ru";

  const modules = await Promise.all(
    NAMESPACES.map((ns) => import(`../../messages/${locale}/${ns}.json`))
  );

  const messages = Object.fromEntries(
    NAMESPACES.map((ns, i) => [ns, modules[i].default])
  );

  return { locale, messages };
});