export const PAGES = {
    HOME: "/",
    
    CASH: "/cash",
    POS: "/pos",
    ONBOARDING: "/onboarding",
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
    
    PROFILE: "/u/profile",
    USER_PROFILE: (userId: string) => `/u/profile/${userId}`,

    LOGIN: "/login",
    REGISTER: "/register",
}