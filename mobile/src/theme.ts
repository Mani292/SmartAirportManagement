// Smart Airport Management — Design System
export const Colors = {
    // Backgrounds - Ultra Deep Canvas
    bg: "#030712",           // Almost black blue for OLED/dark mode
    bgCard: "#0F172A",       // Slate 900
    bgElevated: "#1E293B",   // Slate 800
    bgInput: "rgba(30, 41, 59, 0.7)",      

    // Primary brand - Vibrant Sky
    primary: "#0EA5E9",      // Sky blue
    primaryDark: "#0284C7",
    primaryGlow: "rgba(14, 165, 233, 0.15)",

    // Accent - Deep Purple
    accent: "#8B5CF6",       // Violet
    accentGlow: "rgba(139, 92, 246, 0.15)",

    // Status colors - High Saturation
    critical: "#F43F5E",     // Rose
    criticalBg: "rgba(244, 63, 94, 0.15)",
    high: "#F59E0B",         // Amber
    highBg: "rgba(245, 158, 11, 0.15)",
    medium: "#0EA5E9",       // Sky
    mediumBg: "rgba(14, 165, 233, 0.15)",
    low: "#10B981",          // Emerald
    lowBg: "rgba(16, 185, 129, 0.15)",

    // Safety
    safety: "#F43F5E",
    safetyBg: "rgba(244, 63, 94, 0.2)",

    // Text - Sharp Contrast
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textInverse: "#030712",

    // Borders - Subtle glow
    border: "rgba(248, 250, 252, 0.08)",
    borderActive: "rgba(14, 165, 233, 0.4)",

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
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: {
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
};
