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
    USERS: "/users",
    PAYROLL: "/payroll",
    SALARY: "/salary",
    
    PROFILE: "/u/profile",
    USER_PROFILE: (userId: string) => `/u/profile/${userId}`,

    LOGIN: "/login",
    REGISTER: "/register",
}