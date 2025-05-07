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
            throw error
        }
    },
    postRating: async (body: RatingType) => {
        try {
            const response = await api.post(apiEndpoint.rating, body)
            return response
        } catch (error: unknown) {
            if (error instanceof AxiosError && error.response) {
                // handle error if needed
            }
            throw error
        }
    },
    postFeedback: async (body: FeedBackType) => {
        try {
            const response = await api.post(apiEndpoint.feedback, body)
            return response
        } catch (error: unknown) {
            if (error instanceof AxiosError && error.response) {
                // handle error if needed
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
            throw error;
        }
    }
}

export default tourApiRequest;