import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius, Fonts } from "../theme";

interface Props { priority: string; size?: "sm" | "md" }

const P: Record<string, { color: string; bg: string; label: string }> = {
    "1": { color: "#FF3B5C", bg: "rgba(255,59,92,0.15)", label: "P1 Critical" },
    "2": { color: "#FF8C00", bg: "rgba(255,140,0,0.15)", label: "P2 High" },
    "3": { color: "#00B4FF", bg: "rgba(0,180,255,0.15)", label: "P3 Medium" },
    "4": { color: "#00D283", bg: "rgba(0,210,131,0.15)", label: "P4 Low" },
};

export default function PriorityBadge({ priority, size = "sm" }: Props) {
    const p = P[priority] || { color: "#8896A9", bg: "rgba(136,150,169,0.15)", label: "Unknown" };
    return (
        <View style={[styles.badge, { backgroundColor: p.bg, borderColor: p.color + "60" }, size === "md" && styles.badgeMd]}>
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text style={[styles.label, { color: p.color }, size === "md" && styles.labelMd]}>{p.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    badgeMd: { paddingHorizontal: 14, paddingVertical: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: { fontSize: Fonts.xs, fontWeight: "700", letterSpacing: 0.3 },
    labelMd: { fontSize: Fonts.sm },
});