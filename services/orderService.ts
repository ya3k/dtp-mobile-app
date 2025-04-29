import { TourDetailDataResType, TourResType } from "@/schemaValidation/tour.schema"
import api from "./axiosInstance"
import { apiEndpoint } from "@/config/routes"
import { FullTicketScheduleType } from "@/schemaValidation/ticket-schedule.schema"
import { OrderDetailType, OrderRequestType } from "@/schemaValidation/order.schema";
import { string } from "zod";
import { PaymentRequestType } from "@/schemaValidation/payment.schema";


export const orderApiRequest = {
    postOrder: async (body: OrderRequestType) => {
        try {
            const response = await api.post<{ id: string }>(apiEndpoint.order, body);
            console.log(response.data.id)
            return response.data;
        } catch (error: any) {
            console.error('Order API error:', error.response?.data || error.message)
            throw error
        }
    },
    payment: async (body: PaymentRequestType) => {
        try {
            const response = await api.post(apiEndpoint.payment, body);
            console.log(response.data)
            return response.data;

        } catch (err) {
            throw err;
        }
    },
    cancelPayment: async (paymentId: string) => {
        try {
            const response = await api.put(`${apiEndpoint.payment}/${paymentId}`, {});
            return response;
        } catch (err) {
            throw err;
        }
    },
    cancelPaymentByOrderId: async (orderId: string) => {
        try {
            const response = await api.put(`${apiEndpoint.order}/${orderId}`, "");
            return response.data;
        } catch (err) {
            throw err;
        }
    },
    getOrderDetail: async (orderId: string) => {
        try {
            const response = await api.get<OrderDetailType>(`${apiEndpoint.order}/${orderId}`)

            return response.data
        } catch (error: any) {
            console.error('Order API error:', error.response?.data || error.message)
            throw error
        }
    }

}