import { FeedBackType, RatingType, TourDetailDataResType, TourResType } from "@/schemaValidation/tour.schema"
import api from "./axiosInstance"
import { apiEndpoint } from "@/config/routes"
import { FullTicketScheduleType } from "@/schemaValidation/ticket-schedule.schema"
import { AxiosError } from "axios"

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
    },
    postRating: async (body: RatingType) => {
        console.log('[DEBUG] Calling API - POST rating:', apiEndpoint.rating)
        console.log('[DEBUG] Rating request payload:', JSON.stringify(body))
        try {
            const response = await api.post(apiEndpoint.rating, body)
            console.log('[DEBUG] Rating API response status:', response.status)
            console.log('[DEBUG] Rating API response data:', JSON.stringify(response.data))
            return response
        } catch (error: unknown) {
            console.error('[DEBUG] Rating API error:', error)
            if (error instanceof AxiosError && error.response) {
                console.error('[DEBUG] Rating API error status:', error.response.status)
                console.error('[DEBUG] Rating API error data:', JSON.stringify(error.response.data))
            }
            throw error
        }
    },
    postFeedback: async (body: FeedBackType) => {
        console.log('[DEBUG] Calling API - POST feedback:', apiEndpoint.feedback)
        console.log('[DEBUG] Feedback request payload:', JSON.stringify(body))
        try {
            const response = await api.post(apiEndpoint.feedback, body)
            console.log('[DEBUG] Feedback API response status:', response.status)
            console.log('[DEBUG] Feedback API response data:', JSON.stringify(response.data))
            return response
        } catch (error: unknown) {
            console.error('[DEBUG] Feedback API error:', error)
            if (error instanceof AxiosError && error.response) {
                console.error('[DEBUG] Feedback API error status:', error.response.status)
                console.error('[DEBUG] Feedback API error data:', JSON.stringify(error.response.data))
            }
            throw error
        }
    },
    getTourRatings: async (tourId: string, page: number = 1, pageSize: number = 10) => {
        try {
            const response = await api.get(`${apiEndpoint.rating}/${tourId}`, {
                params: { page, pageSize }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching tour ratings:', error);
            throw error;
        }
    }
}

export default tourApiRequest;