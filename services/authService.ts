import { apiEndpoint } from '@/config/routes';
import { LoginResType, LoginSchemaType } from '@/schemaValidation/auth.schema';
import api from './axiosInstance';


/**
 * Login with credentials
 */
export const login = async (credentials: LoginSchemaType): Promise<LoginResType> => {
  try {
    const response = await api.post<LoginResType>(apiEndpoint.login, credentials);
    return response.data;
  } catch (error: any) {
    console.error('Login API error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<any> => {
  try {
    const response = await api.post(apiEndpoint.logout);
    return response.data;
  } catch (error: any) {
    console.error('Logout API error:', error.response?.data || error.message);
    throw error;
  }
};
