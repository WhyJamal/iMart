export const PAGES = {
    HOME: "/",

    // Documents
    CASH: "/cash",
    POS: "/pos",
    PRODUCTS: "/products",
    PURCHASES: "/purchases",
    SALES: "/sales",
    RETURNS: "/returns",
    PURCHASE_RETURNS: "/purchase-returns",
    WRITE_OFFS: "/write-offs",
    TRANSFERS: "/transfers",
    USERS: "/users",
    CALENDAR: "/calendar",
    WORK_SCHEDULES: "/work-schedules",
    TIMESHEETS: "/timesheets",
    PAYROLL: "/payroll",
    SALARY: "/salary",
    POINTS: "/points",
    WAREHOUSES: "/warehouses",
    CONTRAGENTS: "/contragents",
    PROMOTIONS: "/promotions",

    // Reports
    MATERIAL_REPORT: "/reports/material-report",

    // User profile pages
    PROFILE: "/u/profile",
    USER_PROFILE: (userId: string) => `/u/profile/${userId}`,

    ONBOARDING: "/onboarding",

    // Auth pages
    LOGIN: "/login",
    REGISTER: "/register",
}