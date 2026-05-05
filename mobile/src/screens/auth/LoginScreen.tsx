import React, { useState } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Dimensions, StatusBar, TextInput, ActivityIndicator, Alert
} from "react-native";
import { useDispatch } from "react-redux";
import { login } from "../../store";
import { UserRole } from "../../types";
import { Colors, Fonts, Radius } from "../../theme";
import { loginApi } from "../../services/api";

const { width } = Dimensions.get("window");

const roles: { value: UserRole; label: string; icon: string; desc: string; color: string }[] = [
    { value: "technician", label: "Technician", icon: "⚡", desc: "General tasks", color: "#7C3AED" },
    { value: "security", label: "Security", icon: "🛡", desc: "Security ops", color: "#EF4444" },
    { value: "electrician", label: "Electrician", icon: "🔌", desc: "Electrical", color: "#EAB308" },
    { value: "plumber", label: "Plumber", icon: "🔧", desc: "Plumbing", color: "#3B82F6" },
    { value: "helpstaff", label: "Help Staff", icon: "💁", desc: "Assistance", color: "#EC4899" },
    { value: "manager", label: "Manager", icon: "◎", desc: "Operations", color: "#FF8C00" },
    { value: "admin", label: "Admin", icon: "⚙", desc: "System admin", color: "#00D283" },
];

export default function LoginScreen() {
    const dispatch = useDispatch();
    const [selected, setSelected] = useState<UserRole>("manager");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Missing Fields", "Please enter both username and password.");
            return;
        }

        setLoading(true);
        try {
            const response = await loginApi({ username, password, role: selected });
            if (response.data.success) {
                dispatch(login({
                    role: response.data.role as UserRole,
                    username: response.data.username,
                    userId: response.data.userId,
                }));
            }
        } catch (error) {
            Alert.alert("Login Failed", "Invalid credentials. Please verify your ServiceNow account details.");
        } finally {
            setLoading(false);
        }
    };

    const selectedRole = roles.find(r => r.value === selected)!;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

            {/* Hero Section */}
            <View style={styles.hero}>
                {/* Glow orb */}
                <View style={styles.glowOrb} />

                <View style={styles.logoWrap}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoEmoji}>✈</Text>
                    </View>
                </View>
                <Text style={styles.appName}>Smart Airport</Text>
                <Text style={styles.appSub}>Management</Text>
                <View style={styles.tagRow}>
                    <View style={styles.tagDot} />
                    <Text style={styles.tagText}>AI-Powered Operations Platform</Text>
                    <View style={styles.tagDot} />
                </View>
            </View>

            {/* Role Selector */}
            <View style={styles.panel}>
                <Text style={styles.panelLabel}>Staff Authentication</Text>

                <View style={styles.grid}>
                    {roles.map((r) => {
                        const isSelected = selected === r.value;
                        return (
                            <TouchableOpacity
                                key={r.value}
                                style={[
                                    styles.roleCard,
                                    isSelected && { borderColor: r.color, backgroundColor: r.color + "18" }
                                ]}
                                onPress={() => setSelected(r.value)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.roleIconWrap, { backgroundColor: r.color + "22", borderColor: r.color + "44" }]}>
                                    <Text style={[styles.roleIcon, { color: r.color }]}>{r.icon}</Text>
                                </View>
                                <Text style={[styles.roleLabel, isSelected && { color: r.color }]}>{r.label}</Text>
                                <Text style={styles.roleDesc}>{r.desc}</Text>
                                {isSelected && (
                                    <View style={[styles.selectedDot, { backgroundColor: r.color }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>ServiceNow Username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your username"
                        placeholderTextColor={Colors.textMuted}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>

                <View style={[styles.inputContainer, { marginBottom: 24 }]}>
                    <Text style={styles.inputLabel}>ServiceNow Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={Colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.loginBtn, { backgroundColor: selectedRole.color, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.bg} />
                    ) : (
                        <>
                            <Text style={styles.loginBtnIcon}>{selectedRole.icon}</Text>
                            <Text style={styles.loginBtnText}>Sign in as {selectedRole.label}</Text>
                            <Text style={styles.loginBtnArrow}>→</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footer}>Smart Airport Management v1.0</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    hero: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 20,
        overflow: "hidden",
    },
    glowOrb: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: "rgba(0,180,255,0.07)",
        top: -60,
    },
    logoWrap: {
        marginBottom: 16,
    },
    logoIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "rgba(0,180,255,0.15)",
        borderWidth: 1.5,
        borderColor: "rgba(0,180,255,0.4)",
        alignItems: "center",
        justifyContent: "center",
    },
    logoEmoji: { fontSize: 36, color: Colors.primary },
    appName: {
        fontSize: 34,
        fontWeight: "800",
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    appSub: {
        fontSize: 34,
        fontWeight: "800",
        color: Colors.primary,
        letterSpacing: -0.5,
        marginTop: -6,
    },
    tagRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 12,
    },
    tagDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    tagText: {
        fontSize: Fonts.xs,
        color: Colors.textSecondary,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    panel: {
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    panelLabel: {
        fontSize: Fonts.sm,
        color: Colors.textSecondary,
        marginBottom: 16,
        letterSpacing: 0.3,
        textTransform: "uppercase",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
    },
    roleCard: {
        width: (width - 48 - 10) / 2,
        backgroundColor: Colors.bgElevated,
        borderRadius: Radius.md,
        padding: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: "center",
        position: "relative",
    },
    roleIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    roleIcon: { fontSize: 22, fontWeight: "700" },
    roleLabel: {
        fontSize: Fonts.md,
        fontWeight: "700",
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    roleDesc: {
        fontSize: Fonts.xs,
        color: Colors.textMuted,
        textAlign: "center",
    },
    selectedDot: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    loginBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        borderRadius: Radius.lg,
        gap: 8,
        marginBottom: 16,
    },
    loginBtnIcon: { fontSize: 18, color: Colors.bg },
    loginBtnText: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.bg, flex: 1, textAlign: "center" },
    loginBtnArrow: { fontSize: 18, color: Colors.bg, fontWeight: "700" },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: Fonts.sm,
        color: Colors.textSecondary,
        marginBottom: 8,
        fontWeight: "600",
    },
    input: {
        backgroundColor: Colors.bgElevated,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        padding: 14,
        fontSize: Fonts.md,
        color: Colors.textPrimary,
    },
    footer: {
        textAlign: "center",
        fontSize: Fonts.xs,
        color: Colors.textMuted,
    },
});