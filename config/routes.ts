export const apiEndpoint = {
    //authentication
    login: "/api/authentication/login",
    register: "/api/authentication/register",
    logout: "api/authentication/logout",
    refresh: "/api/authentication/refresh",
    confirmation: "/api/authentication/confirmation",
    fotgotPassword: "/api/authentication/forget-password",
    resetPassword: "/api/authentication/reset-password",
    //user
    profile: "/api/user/me",
    updateProfile: "/api/user",
  
    //tour
    tours: "/api/tour",
    odataTours: "/odata/tour",
    odataTour: "/odata/tour",
    tourScheduleTicket: "/api/tour/scheduleticket",
    tourSchedule: "/api/tour/schedule",
    basket: "/api/basket",
    rating: "api/tour/rating",
    feedback: "/api/tour/feedback",
  
    //order
    order: "/api/order",
    payment: "/api/payment",
  
    //wallet
    wallet: "/api/wallet",
    otp: "/api/wallet/otp",
    withdrawWithOtp: "/api/wallet/withdraw",
    deposit: "/api/wallet/deposit",

    //voucher
    odataVoucher: `/odata/Voucher/Own()`,
    oVoucher: `/odata/voucher`,
    //upload
    upload: "/api/media",
    setting: "/api/system"
  };
  