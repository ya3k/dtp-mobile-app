import { create } from 'zustand';
import { UserProfileType } from '@/schemaValidation/user.schema';
import { userApiRequest } from '@/services/userService';

interface UserState {
  userProfile: UserProfileType | null;
  isLoading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<UserProfileType | null>;
  setUserProfile: (profile: UserProfileType) => void;
  clearUserProfile: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userProfile: null,
  isLoading: false,
  error: null,
  
  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userData = await userApiRequest.getUserProfile();
      console.log(JSON.stringify(userData))
      set({ userProfile: userData, isLoading: false });
      return userData;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      set({ 
        error: error?.message || 'Failed to fetch user profile', 
        isLoading: false 
      });
      return null;
    }
  },
  
  setUserProfile: (profile: UserProfileType) => {
    set({ userProfile: profile });
  },
  
  clearUserProfile: () => {
    console.log('clear user')
    set({ userProfile: null });
  }
})); 