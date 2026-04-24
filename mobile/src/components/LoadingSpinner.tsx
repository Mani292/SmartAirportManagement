import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "../theme";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <View style={styles.indicator} />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.bg,
        gap: 16,
    },
    indicator: {
        width: 40,
        height: 2,
        borderRadius: 1,
        backgroundColor: Colors.primary,
        opacity: 0.4,
    },
    text: {
        color: Colors.textSecondary,
        fontSize: Fonts.sm,
        letterSpacing: 0.5,
    },
});