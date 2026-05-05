import React, { useState } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Dimensions, StatusBar, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useDispatch } from "react-redux";
import { login } from "../../store";
import { UserRole } from "../../types";
import { Colors, Fonts, Radius } from "../../theme";
import { loginApi, requestAccessApi } from "../../services/api";

const { width, height } = Dimensions.get("window");

const roles: { value: UserRole; label: string; icon: string; color: string }[] = [
    { value: "security", label: "Security", icon: "🛡", color: "#EF4444" },
    { value: "electrician", label: "Electrician", icon: "🔌", color: "#EAB308" },
    { value: "plumber", label: "Plumber", icon: "🔧", color: "#3B82F6" },
    { value: "helpstaff", label: "Help Staff", icon: "💁", color: "#EC4899" },
    { value: "technician", label: "Facilities", icon: "⚡", color: "#7C3AED" },
    { value: "manager", label: "Manager", icon: "◎", color: "#FF8C00" },
];

export default function LoginScreen() {
    const dispatch = useDispatch();
    const [mode, setMode] = useState<"login" | "request">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    
    // Request Access State
    const [selectedRole, setSelectedRole] = useState<UserRole>("technician");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    
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

    const handleRequestAccess = async () => {
        if (!email && !phone) {
            Alert.alert("Contact Info Required", "Please enter either an email or phone number to receive your credentials.");
            return;
        }

        setLoading(true);
        try {
            const res = await requestAccessApi({ role: selectedRole, email, phone });
            if (res.data.success) {
                Alert.alert("Request Sent", "Your credentials have been sent via your preferred contact method.");
                setMode("login");
            }
        } catch (error) {
            Alert.alert("Error", "Could not request access. Please try again later.");
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
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Hero / Logo Section */}
                    <View style={styles.hero}>
                        <View style={styles.glowOrb1} />
                        <View style={styles.logoWrap}>
                            <View style={styles.logoIcon}>
                                <Text style={styles.logoEmoji}>✈</Text>
                            </View>
                        </View>
                        <Text style={styles.appName}>Smart Airport</Text>
                        <Text style={styles.appSub}>Management</Text>
                    </View>

                    {/* Login Form Section */}
                    <View style={styles.panel}>
                        {/* Tab Switcher */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity 
                                style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]} 
                                onPress={() => setMode("login")}
                            >
                                <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Sign In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.tabBtn, mode === "request" && styles.tabBtnActive]} 
                                onPress={() => setMode("request")}
                            >
                                <Text style={[styles.tabText, mode === "request" && styles.tabTextActive]}>Request Access</Text>
                            </TouchableOpacity>
                        </View>

                        {mode === "login" ? (
                            <View>
                                <Text style={styles.panelDesc}>Enter your ServiceNow credentials.</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>USERNAME</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. electrician"
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
                                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginBtnText}>Secure Login →</Text>}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.panelDesc}>Select your role and get credentials sent to you.</Text>
                                
                                <Text style={styles.inputLabel}>SELECT YOUR ROLE</Text>
                                <View style={styles.grid}>
                                    {roles.map((r) => {
                                        const isSelected = selectedRole === r.value;
                                        return (
                                            <TouchableOpacity
                                                key={r.value}
                                                style={[
                                                    styles.roleCard,
                                                    isSelected && { borderColor: r.color, backgroundColor: r.color + "18" }
                                                ]}
                                                onPress={() => setSelectedRole(r.value)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.roleIcon, { color: r.color }]}>{r.icon}</Text>
                                                <Text style={[styles.roleLabel, isSelected && { color: r.color }]}>{r.label}</Text>
                                                {isSelected && <View style={[styles.selectedDot, { backgroundColor: r.color }]} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>EMAIL (OPTIONAL)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@airport.com"
                                        placeholderTextColor={Colors.textMuted}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>WHATSAPP PHONE (OPTIONAL)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="+1234567890"
                                        placeholderTextColor={Colors.textMuted}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.loginBtn, { backgroundColor: Colors.accent }, loading && styles.loginBtnDisabled]}
                                    onPress={handleRequestAccess}
                                    activeOpacity={0.85}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginBtnText}>Request Access</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.footerText}>Powered by AeroBot AI & ServiceNow</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "space-between" },
    hero: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        paddingTop: height * 0.08,
        paddingBottom: 30,
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
    logoWrap: { marginBottom: 16 },
    logoIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        borderWidth: 1.5,
        borderColor: "rgba(14, 165, 233, 0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    logoEmoji: { fontSize: 38, color: Colors.primary },
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
        marginTop: -6,
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
        flex: 1,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: Colors.bgElevated,
        borderRadius: Radius.lg,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: Radius.md,
    },
    tabBtnActive: {
        backgroundColor: Colors.bgCard,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
    },
    tabText: {
        fontSize: Fonts.sm,
        color: Colors.textMuted,
        fontWeight: "700",
    },
    tabTextActive: {
        color: Colors.textPrimary,
    },
    panelDesc: {
        fontSize: Fonts.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 10,
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
        padding: 14,
        fontSize: Fonts.md,
        color: Colors.textPrimary,
        fontWeight: "600",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },
    roleCard: {
        width: (width - 64 - 8) / 2,
        backgroundColor: Colors.bgElevated,
        borderRadius: Radius.md,
        padding: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: "center",
        position: "relative",
    },
    roleIcon: { fontSize: 20, marginBottom: 4 },
    roleLabel: { fontSize: 12, fontWeight: "700", color: Colors.textPrimary },
    selectedDot: {
        position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: 3,
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
        opacity: 0.7, shadowOpacity: 0, elevation: 0,
    },
    loginBtnText: {
        fontSize: Fonts.lg, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5,
    },
    footerText: {
        textAlign: "center", fontSize: 11, color: Colors.textMuted, marginTop: 24, letterSpacing: 0.5,
    },
});