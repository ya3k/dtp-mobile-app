import { create } from 'zustand';
import { TourDetailDestinationResType } from '@/schemaValidation/tour.schema';

interface TourState {
  title: string;
  tourDestinations: TourDetailDestinationResType[];
  include: string;
  pickinfor: string;
  otherInfo: {
    notes: string[];
    cancellationPolicy: string[];
  };
  setTourInfo: (
    title: string, 
    destinations: TourDetailDestinationResType[], 
    include?: string,
    pickinfor?: string,
    otherInfo?: {
      notes?: string[];
      cancellationPolicy?: string[];
    }
  ) => void;
  clearTourInfo: () => void;
}

export const useTourStore = create<TourState>((set) => ({
  title: '',
  tourDestinations: [],
  include: '',
  pickinfor: '',
  otherInfo: {
    notes: [],
    cancellationPolicy: []
  },
  setTourInfo: (title, destinations, include = '', pickinfor = '', otherInfo = {}) => set(state => ({ 
    title, 
    tourDestinations: destinations,
    include: include || state.include,
    pickinfor: pickinfor || state.pickinfor,
    otherInfo: {
      notes: otherInfo.notes || state.otherInfo.notes,
      cancellationPolicy: otherInfo.cancellationPolicy || state.otherInfo.cancellationPolicy
    }
  })),
  clearTourInfo: () => set({ 
    title: '', 
    tourDestinations: [],
    include: '',
    pickinfor: '',
    otherInfo: {
      notes: [],
      cancellationPolicy: []
    }
  }),
})); 