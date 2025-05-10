import { create } from 'zustand';
import { SettingType } from '@/schemaValidation/system.setting.schema';

interface SettingState {
  settings: SettingType[];
  setSettings: (settings: SettingType[]) => void;
  getSettingByKey: (key: string) => SettingType | undefined;
  getSettingValueByKey: (key: string) => number | undefined;
}

export const useSettingStore = create<SettingState>((set, get) => ({
  settings: [],
  setSettings: (settings) => set({ settings }),
  getSettingByKey: (key) => {
    const { settings } = get();
    return settings.find(setting => setting.settingKey === key);
  },
  getSettingValueByKey: (key) => {
    const setting = get().getSettingByKey(key);
    return setting?.settingValue;
  },
})); 