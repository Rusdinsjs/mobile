// Theme - Re-exports from themes with default values for backward compatibility
// Use useThemeStore for dynamic theme access in components

import { defaultTheme, themes, getThemeById, Theme, ThemeColors } from './themes';

// Export default theme colors for static usage
export const colors = defaultTheme.colors;

// Spacing and other non-color values remain constant
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 40,
};

export const borderRadius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    glow: {
        shadowColor: '#06B6D4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
};

export const typography = {
    h1: {
        fontSize: 26,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 16,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 14,
        fontWeight: '400' as const,
    },
    bodySmall: {
        fontSize: 13,
        fontWeight: '400' as const,
    },
    caption: {
        fontSize: 11,
        fontWeight: '500' as const,
        letterSpacing: 0.3,
    },
    clock: {
        fontSize: 48,
        fontWeight: '200' as const,
        letterSpacing: -1,
    },
};

// Re-export theme utilities
export { themes, getThemeById, defaultTheme };
export type { Theme, ThemeColors };
