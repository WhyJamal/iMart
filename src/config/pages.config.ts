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
    DEBTORS: "/debtors",
    PROMOTIONS: "/promotions",
    
    // Reports
    MATERIAL_REPORT: "/reports/material-report",
    DEBT_REPORT: "/reports/debt-report",

    // Profile
    PROFILE: "/u/profile",
    USER_PROFILE: (userId: string) => `/u/profile/${userId}`,

    ONBOARDING: "/onboarding",
    SELECT_ORGANIZATION: "/select-organization",
    // Auth
    LOGIN: "/login",
    REGISTER: "/register",
    SUBSCRIPTION_EXPIRED: "/subscription-expired",
}