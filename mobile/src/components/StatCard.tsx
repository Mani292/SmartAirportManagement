import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts, Radius, Shadow } from "../theme";

interface Props {
    title: string;
    value: string | number;
    color?: string;
    icon?: string;
    subtitle?: string;
}

export default function StatCard({ title, value, color = Colors.primary, icon, subtitle }: Props) {
    return (
        <View style={[styles.card, { borderTopColor: color }]}>
            <View style={[styles.iconWrap, { backgroundColor: color + "18" }]}>
                <Text style={styles.iconText}>{icon}</Text>
            </View>
            <Text style={[styles.value, { color }]}>{value}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: 16,
        margin: 5,
        borderTopWidth: 3,
        alignItems: "flex-start",
        ...Shadow.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    iconText: { fontSize: 18 },
    value: {
        fontSize: 32,
        fontWeight: "800",
        letterSpacing: -1,
        lineHeight: 36,
    },
    title: {
        fontSize: Fonts.xs,
        color: Colors.textSecondary,
        marginTop: 4,
        fontWeight: "600",
        letterSpacing: 0.3,
        textTransform: "uppercase",
    },
    subtitle: {
        fontSize: Fonts.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
});