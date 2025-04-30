import { TourResType } from "@/schemaValidation/tour.schema"
import api from "./axiosInstance"
import { apiEndpoint } from "@/config/routes"
import { PUTUserType, UserProfileType } from "@/schemaValidation/user.schema"

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
    putUserProfile: async (userData: PUTUserType) => {
        try {
            console.log(JSON.stringify(userData))

            const response = await api.put(
                `${apiEndpoint.updateProfile}`,
                userData
            );
            console.log(JSON.stringify(response))
            return response.data;
        } catch (error) {
            console.error("Error updating user data:", error)
            throw error
        }
    }

}