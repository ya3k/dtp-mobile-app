import { TourResType } from "@/schemaValidation/tour.schema"
import api from "./axiosInstance"
import { apiEndpoint } from "@/config/routes"
import { UserProfileType } from "@/schemaValidation/user.schema"

// Define the API response type that includes the data wrapper
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const userApiRequest = {
    getUserProfile: async () => {
        try {         
            const response = await api.get<ApiResponse<UserProfileType>>(
                `${apiEndpoint.profile}`,               
            );

            return response.data.data;
        } catch (error) {
            console.error("Error fetching user data:", error)
            throw error
        }
    },
    
}