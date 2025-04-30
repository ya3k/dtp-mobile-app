import { WalletType } from "@/schemaValidation/wallet.schema";
import api from "./axiosInstance"
import { apiEndpoint } from "@/config/routes"



export const walletApiRequest = {
    getWallet: async () => {
        try {
            const response = await api.get<WalletType>(`${apiEndpoint.wallet}`)

            return response.data;
        } catch (error) {
            console.error("Error fetching wallet data:", error)
            throw error
        }
    },
}