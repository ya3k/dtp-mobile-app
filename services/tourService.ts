import { TourDetailDataResType, TourResType } from "@/schemaValidation/tour.schema"
import api from "./axiosInstance"
import { apiEndpoint } from "@/config/routes"
import { FullTicketScheduleType } from "@/schemaValidation/ticket-schedule.schema"

// Define the API response type
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const tourApiRequest = {
    getOdataTour: async (query?: string) => {
        try {
            // Ensure we always have a query parameter to prevent caching
            const queryString = query

            // Add cache control headers
            const headers = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };

            const response = await api.get<{ value: TourResType[] }>(
                `${apiEndpoint.odataTour}${queryString}`,
                { headers }
            );

            return response.data.value;
        } catch (error) {
            console.error("Error fetching tour data:", error)
            throw error
        }
    },
    getTourDetail: async (id: any) => {
        try {
            const response = await api.get<TourDetailDataResType>(
                `${apiEndpoint.tours}/${id}`,
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching tour data:", error)
            throw error
        }
    },
    getTicketSchedule: async (id: any) => {
        try {
            const response = await api.get<ApiResponse<FullTicketScheduleType>>(
                `${apiEndpoint.tourScheduleTicket}/${id}`,
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching tour schedule data:", error)
            throw error
        }
    }
}