// Smart Airport Management — Design System
export const Colors = {
    // Backgrounds
    bg: "#0A0F1E",           // Deep navy black
    bgCard: "#111827",       // Card background
    bgElevated: "#1C2537",   // Elevated surface
    bgInput: "#162030",      // Input background

    // Primary brand
    primary: "#00B4FF",      // Electric blue
    primaryDark: "#0077B6",
    primaryGlow: "rgba(0,180,255,0.15)",

    // Accent
    accent: "#7C3AED",       // Purple accent
    accentGlow: "rgba(124,58,237,0.15)",

    // Status colors
    critical: "#FF3B5C",     // Red
    criticalBg: "rgba(255,59,92,0.12)",
    high: "#FF8C00",         // Orange
    highBg: "rgba(255,140,0,0.12)",
    medium: "#00B4FF",       // Blue
    mediumBg: "rgba(0,180,255,0.12)",
    low: "#00D283",          // Green
    lowBg: "rgba(0,210,131,0.12)",

    // Safety
    safety: "#FF3B5C",
    safetyBg: "rgba(255,59,92,0.1)",

    // Text
    textPrimary: "#F0F4FF",
    textSecondary: "#8896A9",
    textMuted: "#4A5568",
    textInverse: "#0A0F1E",

    // Borders
    border: "rgba(255,255,255,0.07)",
    borderActive: "rgba(0,180,255,0.4)",

    // White
    white: "#FFFFFF",
};

export const Priority = {
    "1": { color: Colors.critical, bg: Colors.criticalBg, label: "P1 Critical" },
    "2": { color: Colors.high, bg: Colors.highBg, label: "P2 High" },
    "3": { color: Colors.medium, bg: Colors.mediumBg, label: "P3 Medium" },
    "4": { color: Colors.low, bg: Colors.lowBg, label: "P4 Low" },
};

export const StateMap = {
    "1": { label: "New", color: Colors.high, icon: "●" },
    "2": { label: "In Progress", color: Colors.primary, icon: "◆" },
    "3": { label: "On Hold", color: Colors.textSecondary, icon: "⏸" },
    "6": { label: "Resolved", color: Colors.low, icon: "✓" },
    "7": { label: "Closed", color: Colors.textMuted, icon: "✕" },
};

export const Fonts = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
};

export const Radius = {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 999,
};

export const Shadow = {
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    glow: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
};
