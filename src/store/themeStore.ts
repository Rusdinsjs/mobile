// Theme Store - Manages theme selection with persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, themes, defaultTheme, getThemeById } from '../styles/themes';

interface ThemeState {
    currentTheme: Theme;
    themeId: string;
    setTheme: (themeId: string) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            currentTheme: defaultTheme,
            themeId: defaultTheme.id,
            setTheme: (themeId: string) => {
                const theme = getThemeById(themeId);
                set({ currentTheme: theme, themeId: theme.id });
            },
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ themeId: state.themeId }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.currentTheme = getThemeById(state.themeId);
                }
            },
        }
    )
);

// Hook for easy color access
export const useColors = () => {
    return useThemeStore((state) => state.currentTheme.colors);
};

export default useThemeStore;
