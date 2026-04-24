import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Incident } from "../types";
import PriorityBadge from "./PriorityBadge";
import { Colors, Fonts, Radius } from "../theme";

interface Props { incident: Incident; onPress?: () => void }

const stateMap: Record<string, { label: string; color: string }> = {
    "1": { label: "New", color: "#FF8C00" },
    "2": { label: "In Progress", color: "#00B4FF" },
    "3": { label: "On Hold", color: "#8896A9" },
    "6": { label: "Resolved", color: "#00D283" },
    "7": { label: "Closed", color: "#4A5568" },
};

export default function IncidentCard({ incident, onPress }: Props) {
    const state = stateMap[incident.state] || { label: "Unknown", color: "#888" };
    const isCritical = incident.priority === "1";
    const isSafetyRisk = incident.u_safety_risk === "true";

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isCritical && styles.criticalCard,
            ]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {isSafetyRisk && (
                <View style={styles.safetyBanner}>
                    <Text style={styles.safetyBannerText}>⚠  SAFETY RISK</Text>
                </View>
            )}

            <View style={styles.topRow}>
                <View style={styles.numberRow}>
                    <View style={[styles.stateDot, { backgroundColor: state.color }]} />
                    <Text style={styles.number}>{incident.number}</Text>
                </View>
                <PriorityBadge priority={incident.priority} />
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {incident.short_description}
            </Text>

            <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                    <Text style={styles.metaIcon}>◎</Text>
                    <Text style={styles.metaText}>{incident.location}</Text>
                </View>
                {incident.u_area ? (
                    <View style={styles.metaChip}>
                        <Text style={styles.metaIcon}>◈</Text>
                        <Text style={styles.metaText}>{incident.u_area}</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.bottomRow}>
                <View style={[styles.stateTag, { backgroundColor: state.color + "18", borderColor: state.color + "40" }]}>
                    <Text style={[styles.stateText, { color: state.color }]}>{state.label}</Text>
                </View>
                {incident.u_ai_category ? (
                    <Text style={styles.category}>{incident.u_ai_category}</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: "hidden",
    },
    criticalCard: {
        borderColor: "rgba(255,59,92,0.3)",
        backgroundColor: "rgba(255,59,92,0.04)",
    },
    safetyBanner: {
        backgroundColor: "rgba(255,59,92,0.15)",
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 10,
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: "rgba(255,59,92,0.3)",
    },
    safetyBannerText: {
        color: "#FF3B5C",
        fontSize: Fonts.xs,
        fontWeight: "800",
        letterSpacing: 1,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    numberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stateDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    number: {
        fontSize: Fonts.sm,
        fontWeight: "700",
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: Fonts.md,
        color: Colors.textPrimary,
        lineHeight: 22,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 12,
    },
    metaChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.bgElevated,
        borderRadius: Radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    metaIcon: { fontSize: 10, color: Colors.textMuted },
    metaText: { fontSize: Fonts.xs, color: Colors.textSecondary },
    bottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    stateTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    stateText: { fontSize: Fonts.xs, fontWeight: "700" },
    category: {
        fontSize: Fonts.xs,
        color: Colors.textMuted,
    },
});