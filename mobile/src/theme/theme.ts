// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\theme\theme.ts
import { MD3LightTheme, configureFonts, MD3DarkTheme } from 'react-native-paper';

// Modern, Professional Color Palette
// Modern, Professional Color Palette
export const colors = {
    // Primary gradient colors
    primary: '#ec1616', // Requested Deep Red
    primaryDark: '#b91313',
    primaryLight: '#ff4d4d',

    // Secondary/Accent
    secondary: '#333333', // Dark gray for contrast
    secondaryDark: '#1a1a1a',

    // Surface colors
    background: '#f3f4f6', // Requested Light Gray
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#fe0000', // Match error with primary red
    info: '#3B82F6',

    // Text colors
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    // Border & Divider
    border: '#E2E8F0',
    divider: '#F1F5F9',

    // Gradient backgrounds
    gradientStart: '#2563EB',
    gradientEnd: '#7C3AED', // Purple accent

    // Card shadows
    shadowLight: 'rgba(15, 23, 42, 0.06)',
    shadowMedium: 'rgba(15, 23, 42, 0.12)',
};

// Dark theme colors
export const darkColors = {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#93C5FD',

    secondary: '#34D399',
    secondaryDark: '#10B981',

    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',

    border: '#334155',
    divider: '#1E293B',

    gradientStart: '#3B82F6',
    gradientEnd: '#8B5CF6',

    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const typography = {
    headlineLarge: {
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
    },
    headlineMedium: {
        fontSize: 24,
        fontWeight: '600' as const,
        letterSpacing: -0.3,
    },
    headlineSmall: {
        fontSize: 20,
        fontWeight: '600' as const,
    },
    titleLarge: {
        fontSize: 18,
        fontWeight: '600' as const,
    },
    titleMedium: {
        fontSize: 16,
        fontWeight: '500' as const,
    },
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400' as const,
    },
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400' as const,
    },
    bodySmall: {
        fontSize: 12,
        fontWeight: '400' as const,
    },
    labelLarge: {
        fontSize: 14,
        fontWeight: '500' as const,
    },
    labelMedium: {
        fontSize: 12,
        fontWeight: '500' as const,
    },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
};

export const theme = {
    ...MD3LightTheme,
    roundness: borderRadius.md,
    colors: {
        ...MD3LightTheme.colors,
        primary: colors.primary,
        secondary: colors.secondary,
        background: colors.background,
        surface: colors.surface,
        error: colors.error,
        onPrimary: colors.textOnPrimary,
        onSurface: colors.textPrimary,
        onBackground: colors.textPrimary,
        surfaceVariant: colors.divider,
        outline: colors.border,
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    roundness: borderRadius.md,
    colors: {
        ...MD3DarkTheme.colors,
        primary: darkColors.primary,
        secondary: darkColors.secondary,
        background: darkColors.background,
        surface: darkColors.surface,
        error: darkColors.error,
        onPrimary: darkColors.textOnPrimary,
        onSurface: darkColors.textPrimary,
        onBackground: darkColors.textPrimary,
        surfaceVariant: darkColors.divider,
        outline: darkColors.border,
    },
};

export default { theme, darkTheme, colors, darkColors, spacing, borderRadius, typography, shadows };