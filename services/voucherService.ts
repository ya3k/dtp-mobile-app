import { VoucherResType } from "@/schemaValidation/voucher.schema";
import api from "./axiosInstance";
import { apiEndpoint } from "@/config/routes";

// Define the API response type that includes the data wrapper
interface OdataResponse<T> {
    value: T[];
    "@odata.count": number;
}

export const voucherApiRequest = {
    getOdata: async () => {
        try {
            const today = new Date().toISOString().split("T")[0];

            // // Tạo filter OData hợp lệ
            // const filter = `$filter=expiryDate gt cast(${today}, Edm.Date) and isDeleted eq false`;
            const filter = `$filter=expiryDate gt cast(${today}, Edm.Date)`;

            const url = `${apiEndpoint.odataVoucher}?$count=true&${encodeURI(filter)}`;
            console.log(url)
            const response = await api.get<OdataResponse<VoucherResType>>(url);
            console.log(JSON.stringify(response.data))
            return response.data.value;
        } catch (error) {
            console.error("Fetch Voucher fail:", error);
            throw error;
        }
    },
    
    getOwnVouchers: async () => {
        try {
            const url = `${apiEndpoint.odataVoucher}`;
            const response = await api.get<OdataResponse<VoucherResType>>(url);
            return response.data.value;
        } catch (error) {
            console.error("Fetch Own Vouchers fail:", error);
            throw error;
        }
    },
};
