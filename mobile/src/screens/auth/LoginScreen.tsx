import React, { useState } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Dimensions, StatusBar, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { useDispatch } from "react-redux";
import { login } from "../../store";
import { UserRole } from "../../types";
import { Colors, Fonts, Radius } from "../../theme";
import { loginApi } from "../../services/api";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
    const dispatch = useDispatch();
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
            const response = await loginApi({ username, password });
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                {/* Hero / Logo Section */}
                <View style={styles.hero}>
                    <View style={styles.glowOrb1} />
                    <View style={styles.glowOrb2} />
                    
                    <View style={styles.logoWrap}>
                        <View style={styles.logoIcon}>
                            <Text style={styles.logoEmoji}>✈</Text>
                        </View>
                    </View>
                    <Text style={styles.appName}>Smart Airport</Text>
                    <Text style={styles.appSub}>Management</Text>
                    
                    <View style={styles.tagRow}>
                        <View style={styles.tagDot} />
                        <Text style={styles.tagText}>Staff Access Portal</Text>
                        <View style={styles.tagDot} />
                    </View>
                </View>

                {/* Login Form Section */}
                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Sign In</Text>
                    <Text style={styles.panelDesc}>Enter your ServiceNow credentials to access your assigned tasks and dashboard.</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>USERNAME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. electrician, manager"
                            placeholderTextColor={Colors.textMuted}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>PASSWORD</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        activeOpacity={0.85}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginBtnText}>Secure Login →</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footerText}>Powered by AeroBot AI & ServiceNow</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    keyboardView: { flex: 1, justifyContent: "space-between" },
    hero: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        paddingTop: height * 0.05,
    },
    glowOrb1: {
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: Colors.primaryGlow,
        top: -100,
        left: -50,
        transform: [{ scale: 1.2 }]
    },
    glowOrb2: {
        position: "absolute",
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: "rgba(139, 92, 246, 0.12)",
        bottom: 0,
        right: -50,
    },
    logoWrap: { marginBottom: 20 },
    logoIcon: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        borderWidth: 1.5,
        borderColor: "rgba(14, 165, 233, 0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    logoEmoji: { fontSize: 42, color: Colors.primary },
    appName: {
        fontSize: Fonts.xxl,
        fontWeight: "900",
        color: Colors.textPrimary,
        letterSpacing: -0.8,
    },
    appSub: {
        fontSize: Fonts.xxl,
        fontWeight: "900",
        color: Colors.primary,
        letterSpacing: -0.8,
        marginTop: -8,
    },
    tagRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: Colors.bgElevated,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.border
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.accent,
    },
    tagText: {
        fontSize: Fonts.xs,
        color: Colors.textSecondary,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: "700"
    },
    panel: {
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: Radius.xxl,
        borderTopRightRadius: Radius.xxl,
        padding: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 32,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    panelTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    panelDesc: {
        fontSize: Fonts.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 32,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 11,
        color: Colors.primary,
        marginBottom: 8,
        fontWeight: "700",
        letterSpacing: 1.5,
    },
    input: {
        backgroundColor: Colors.bgElevated,
        borderWidth: 1.5,
        borderColor: Colors.borderActive,
        borderRadius: Radius.lg,
        padding: 16,
        fontSize: Fonts.md,
        color: Colors.textPrimary,
        fontWeight: "600",
    },
    loginBtn: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: Radius.lg,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    loginBtnDisabled: {
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    loginBtnText: {
        fontSize: Fonts.lg,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    footerText: {
        textAlign: "center",
        fontSize: 11,
        color: Colors.textMuted,
        marginTop: 24,
        letterSpacing: 0.5,
    },
});