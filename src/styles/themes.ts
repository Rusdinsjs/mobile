// Theme Definitions - 5 Premium Themes
export interface ThemeColors {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    gold: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    white: string;
    background: string;
    surface: string;
    surfaceLight: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    glassBg: string;
    glassBorder: string;
}

export interface Theme {
    id: string;
    name: string;
    icon: string;
    colors: ThemeColors;
}

// 1. Deep Navy Premium (Default)
const oceanDark: Theme = {
    id: 'ocean_dark',
    name: 'Deep Navy',
    icon: '🌌',
    colors: {
        primary: '#0A1628',
        primaryLight: '#152238',
        primaryDark: '#050D17',
        accent: '#3B82F6',
        accentLight: '#60A5FA',
        accentDark: '#2563EB',
        gold: '#F59E0B',
        success: '#10B981',
        successLight: '#34D399',
        warning: '#F59E0B',
        warningLight: '#FCD34D',
        error: '#EF4444',
        errorLight: '#FCA5A5',
        white: '#FFFFFF',
        background: '#0A1628',
        surface: '#152238',
        surfaceLight: '#1E3A5F',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        glassBg: 'rgba(21, 34, 56, 0.85)',
        glassBorder: 'rgba(59, 130, 246, 0.2)',
    },
};

// 2. Midnight Purple
const midnightPurple: Theme = {
    id: 'midnight_purple',
    name: 'Midnight Purple',
    icon: '🔮',
    colors: {
        primary: '#1A1025',
        primaryLight: '#2D1B3D',
        primaryDark: '#0D0812',
        accent: '#A855F7',
        accentLight: '#C084FC',
        accentDark: '#9333EA',
        gold: '#FBBF24',
        success: '#10B981',
        successLight: '#34D399',
        warning: '#F59E0B',
        warningLight: '#FCD34D',
        error: '#F43F5E',
        errorLight: '#FDA4AF',
        white: '#FFFFFF',
        background: '#1A1025',
        surface: '#2D1B3D',
        surfaceLight: '#432663',
        textPrimary: '#FAF5FF',
        textSecondary: '#C4B5FD',
        textMuted: '#8B5CF6',
        glassBg: 'rgba(45, 27, 61, 0.85)',
        glassBorder: 'rgba(168, 85, 247, 0.2)',
    },
};

// 3. Forest Green
const forestGreen: Theme = {
    id: 'forest_green',
    name: 'Forest Green',
    icon: '🌲',
    colors: {
        primary: '#0D1F17',
        primaryLight: '#14352B',
        primaryDark: '#050F0A',
        accent: '#22C55E',
        accentLight: '#4ADE80',
        accentDark: '#16A34A',
        gold: '#FBBF24',
        success: '#22C55E',
        successLight: '#4ADE80',
        warning: '#EAB308',
        warningLight: '#FDE047',
        error: '#EF4444',
        errorLight: '#FCA5A5',
        white: '#FFFFFF',
        background: '#0D1F17',
        surface: '#14352B',
        surfaceLight: '#1E503F',
        textPrimary: '#F0FDF4',
        textSecondary: '#86EFAC',
        textMuted: '#4ADE80',
        glassBg: 'rgba(20, 53, 43, 0.85)',
        glassBorder: 'rgba(34, 197, 94, 0.2)',
    },
};

// 4. Sunset Orange
const sunsetOrange: Theme = {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    icon: '🌅',
    colors: {
        primary: '#1C1210',
        primaryLight: '#2E1D18',
        primaryDark: '#0E0908',
        accent: '#F97316',
        accentLight: '#FB923C',
        accentDark: '#EA580C',
        gold: '#FCD34D',
        success: '#22C55E',
        successLight: '#4ADE80',
        warning: '#F97316',
        warningLight: '#FDBA74',
        error: '#DC2626',
        errorLight: '#FCA5A5',
        white: '#FFFFFF',
        background: '#1C1210',
        surface: '#2E1D18',
        surfaceLight: '#4A2C21',
        textPrimary: '#FFF7ED',
        textSecondary: '#FDBA74',
        textMuted: '#FB923C',
        glassBg: 'rgba(46, 29, 24, 0.85)',
        glassBorder: 'rgba(249, 115, 22, 0.2)',
    },
};

// 5. Arctic Light
const arcticLight: Theme = {
    id: 'arctic_light',
    name: 'Arctic Light',
    icon: '❄️',
    colors: {
        primary: '#F8FAFC',
        primaryLight: '#FFFFFF',
        primaryDark: '#E2E8F0',
        accent: '#0EA5E9',
        accentLight: '#38BDF8',
        accentDark: '#0284C7',
        gold: '#F59E0B',
        success: '#059669',
        successLight: '#34D399',
        warning: '#D97706',
        warningLight: '#FCD34D',
        error: '#DC2626',
        errorLight: '#FCA5A5',
        white: '#FFFFFF',
        background: '#F1F5F9',
        surface: '#FFFFFF',
        surfaceLight: '#E2E8F0',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#94A3B8',
        glassBg: 'rgba(255, 255, 255, 0.9)',
        glassBorder: 'rgba(14, 165, 233, 0.15)',
    },
};

// All themes collection
export const themes: Theme[] = [
    oceanDark,
    midnightPurple,
    forestGreen,
    sunsetOrange,
    arcticLight,
];

export const getThemeById = (id: string): Theme => {
    return themes.find(t => t.id === id) || oceanDark;
};

export const defaultTheme = oceanDark;
