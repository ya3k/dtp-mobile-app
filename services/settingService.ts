import { SettingType } from "@/schemaValidation/system.setting.schema";
import api from "./axiosInstance";
import { apiEndpoint } from "@/config/routes";


export const systemApiRequest = {
    getSetting: async () => {
        try {
            const response = await api.get<SettingType[]>(apiEndpoint.setting);
            console.log(JSON.stringify(response.data))
            return response.data;
        } catch (error) {
            console.error("Fetch setting fail:", error);
            throw error;
        }
    },
    
};
