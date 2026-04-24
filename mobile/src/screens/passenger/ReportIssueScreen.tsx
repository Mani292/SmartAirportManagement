import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, SafeAreaView, Alert, StatusBar, FlatList
} from "react-native";
import { createIncident } from "../../services/api";
import { Colors, Fonts, Radius } from "../../theme";

const TERMINALS = ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"];
const AREAS = ["Restroom", "Elevator", "Escalator", "Gate", "Baggage Claim", "Lounge", "Parking", "Security", "Other"];
const DEPARTMENTS = ["Facilities", "IT Support", "Security", "Housekeeping", "Ground Operations", "HR"];

const DEPT_ICONS: Record<string, string> = {
    Facilities: "◈", "IT Support": "⌁", Security: "◎", Housekeeping: "✦", "Ground Operations": "◆", HR: "◉"
};

export default function ReportIssueScreen() {
    const [form, setForm] = useState({
        short_description: "", location: "", area: "",
        department: "Facilities", reporter_phone: "", reported_via: "App",
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [step, setStep] = useState(1);

    const handleSubmit = async () => {
        if (!form.short_description || !form.location || !form.area) {
            Alert.alert("Missing Info", "Please fill in all required fields.");
            return;
        }
        setLoading(true);
        try {
            const res = await createIncident(form);
            setResult(res.data);
            setSubmitted(true);
        } catch (e: any) {
            Alert.alert("Error", e.message || "Something went wrong. Please try again.");
        }
        setLoading(false);
    };

    if (submitted && result) {
        const triage = result.ai_triage;
        const incNum = result.incident?.result?.number;
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
                <ScrollView contentContainerStyle={styles.successScroll}>
                    {/* Success Icon */}
                    <View style={styles.successIconWrap}>
                        <Text style={styles.successIconText}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>Issue Reported!</Text>
                    <Text style={styles.successSub}>Your report has been received and is being processed</Text>

                    {/* Incident Number */}
                    <View style={styles.incCard}>
                        <Text style={styles.incLabel}>INCIDENT NUMBER</Text>
                        <Text style={styles.incNumber}>{incNum || "—"}</Text>
                        <Text style={styles.incHint}>Save this to track your issue</Text>
                    </View>

                    {/* AI Triage Result */}
                    {triage && (
                        <View style={styles.triageCard}>
                            <View style={styles.triageHeader}>
                                <Text style={styles.triageEmoji}>⚡</Text>
                                <Text style={styles.triageTitle}>AI Analysis Complete</Text>
                            </View>
                            <View style={styles.triageGrid}>
                                <TriageRow label="Category" value={triage.category} />
                                <TriageRow label="Priority" value={`P${triage.priority}`} highlight color={["#FF3B5C","#FF8C00","#00B4FF","#00D283"][triage.priority-1]} />
                                <TriageRow label="Team" value={triage.assigned_team} />
                                <TriageRow label="Est. Fix" value={`${triage.estimated_fix_mins} mins`} />
                            </View>
                            <View style={styles.actionBox}>
                                <Text style={styles.actionLabel}>Recommended First Action</Text>
                                <Text style={styles.actionText}>{triage.recommended_action}</Text>
                            </View>
                        </View>
                    )}

                    {form.reporter_phone ? (
                        <View style={styles.waNote}>
                            <Text style={styles.waNoteText}>✓ WhatsApp confirmation sent to {form.reporter_phone}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={styles.reportAnotherBtn}
                        onPress={() => { setSubmitted(false); setResult(null); setStep(1); setForm({ ...form, short_description: "", reporter_phone: "" }); }}
                    >
                        <Text style={styles.reportAnotherText}>Report Another Issue</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.topHeader}>
                    <Text style={styles.heading}>Report Issue</Text>
                    <Text style={styles.headingSub}>Help us fix it fast</Text>
                </View>

                {/* Step indicator */}
                <View style={styles.stepRow}>
                    {[1, 2, 3].map(s => (
                        <View key={s} style={styles.stepItem}>
                            <View style={[styles.stepDot, s <= step && styles.stepDotActive]} />
                            <Text style={[styles.stepText, s === step && styles.stepTextActive]}>
                                {["Location", "Issue", "Contact"][s-1]}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Terminal */}
                <Text style={styles.label}>Terminal</Text>
                <View style={styles.chips}>
                    {TERMINALS.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.chip, form.location === t && styles.chipActive]}
                            onPress={() => { setForm({ ...form, location: t }); setStep(s => Math.max(s, 1)); }}
                        >
                            <Text style={[styles.chipText, form.location === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Area */}
                <Text style={styles.label}>Area</Text>
                <View style={styles.chips}>
                    {AREAS.map((a) => (
                        <TouchableOpacity
                            key={a}
                            style={[styles.chip, form.area === a && styles.chipActive]}
                            onPress={() => { setForm({ ...form, area: a }); setStep(s => Math.max(s, 1)); }}
                        >
                            <Text style={[styles.chipText, form.area === a && styles.chipTextActive]}>{a}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Department */}
                <Text style={styles.label}>Department</Text>
                <View style={styles.deptGrid}>
                    {DEPARTMENTS.map((d) => (
                        <TouchableOpacity
                            key={d}
                            style={[styles.deptCard, form.department === d && styles.deptCardActive]}
                            onPress={() => { setForm({ ...form, department: d }); setStep(s => Math.max(s, 2)); }}
                        >
                            <Text style={[styles.deptIcon, form.department === d && styles.deptIconActive]}>{DEPT_ICONS[d]}</Text>
                            <Text style={[styles.deptText, form.department === d && styles.deptTextActive]}>{d}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Description */}
                <Text style={styles.label}>Describe the Issue</Text>
                <TextInput
                    style={styles.textarea}
                    value={form.short_description}
                    onChangeText={t => { setForm({ ...form, short_description: t }); setStep(s => Math.max(s, 2)); }}
                    placeholder="e.g. Escalator near Gate B12 is making loud noise and stopping..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                {/* Phone */}
                <Text style={styles.label}>WhatsApp Number <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput
                    style={styles.input}
                    value={form.reporter_phone}
                    onChangeText={t => setForm({ ...form, reporter_phone: t })}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                />
                <Text style={styles.hint}>Receive WhatsApp updates when your issue is resolved</Text>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, (loading || !form.short_description || !form.location) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading || !form.short_description || !form.location}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <View style={styles.submitLoading}>
                            <Text style={styles.submitLoadingText}>⚡ AI is analyzing your issue...</Text>
                        </View>
                    ) : (
                        <Text style={styles.submitText}>Submit Report →</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

function TriageRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
    return (
        <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
            <Text style={{ fontSize: Fonts.md, fontWeight: highlight ? "800" : "600", color: color || Colors.textPrimary, marginTop: 2 }}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: 20, paddingBottom: 50 },
    topHeader: { marginBottom: 20 },
    heading: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    headingSub: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },
    stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 0 },
    stepItem: { flex: 1, alignItems: "center", gap: 4 },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
    stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    stepText: { fontSize: Fonts.xs, color: Colors.textMuted },
    stepTextActive: { color: Colors.primary, fontWeight: "700" },
    label: { fontSize: Fonts.xs, fontWeight: "700", color: Colors.textSecondary, marginBottom: 10, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
    optional: { fontWeight: "400", color: Colors.textMuted, textTransform: "none" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
    chipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.borderActive },
    chipText: { fontSize: Fonts.sm, color: Colors.textSecondary, fontWeight: "600" },
    chipTextActive: { color: Colors.primary },
    deptGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    deptCard: {
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: Radius.md, backgroundColor: Colors.bgCard,
        borderWidth: 1, borderColor: Colors.border,
    },
    deptCardActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.borderActive },
    deptIcon: { fontSize: 16, color: Colors.textMuted },
    deptIconActive: { color: Colors.primary },
    deptText: { fontSize: Fonts.sm, color: Colors.textSecondary, fontWeight: "600" },
    deptTextActive: { color: Colors.primary },
    textarea: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.md,
        padding: 14, color: Colors.textPrimary, fontSize: Fonts.md,
        borderWidth: 1, borderColor: Colors.border,
        minHeight: 110, textAlignVertical: "top",
    },
    input: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.md,
        padding: 14, color: Colors.textPrimary, fontSize: Fonts.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    hint: { fontSize: Fonts.xs, color: Colors.textMuted, marginTop: 6 },
    submitBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.lg,
        padding: 18, alignItems: "center", marginTop: 28,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: Colors.bg, fontSize: Fonts.lg, fontWeight: "800" },
    submitLoading: { flexDirection: "row", alignItems: "center" },
    submitLoadingText: { color: Colors.bg, fontSize: Fonts.md, fontWeight: "700" },
    // Success
    successScroll: { padding: 24, paddingBottom: 50, alignItems: "center" },
    successIconWrap: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: "rgba(0,210,131,0.15)",
        borderWidth: 2, borderColor: "rgba(0,210,131,0.3)",
        alignItems: "center", justifyContent: "center", marginTop: 20, marginBottom: 16,
    },
    successIconText: { fontSize: 44, color: "#00D283", fontWeight: "800" },
    successTitle: { fontSize: Fonts.xxxl, fontWeight: "800", color: Colors.textPrimary, textAlign: "center" },
    successSub: { fontSize: Fonts.sm, color: Colors.textSecondary, textAlign: "center", marginTop: 8, marginBottom: 24 },
    incCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 24, alignItems: "center", width: "100%",
        marginBottom: 16, borderWidth: 1,
        borderColor: Colors.borderActive,
    },
    incLabel: { fontSize: Fonts.xs, color: Colors.textMuted, letterSpacing: 1.5, textTransform: "uppercase" },
    incNumber: { fontSize: 30, fontWeight: "800", color: Colors.primary, marginTop: 8 },
    incHint: { fontSize: Fonts.xs, color: Colors.textMuted, marginTop: 4 },
    triageCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 20, width: "100%", marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    triageHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
    triageEmoji: { fontSize: 20, color: Colors.primary },
    triageTitle: { fontSize: Fonts.md, fontWeight: "800", color: Colors.textPrimary },
    triageGrid: { marginBottom: 14 },
    actionBox: {
        backgroundColor: Colors.primaryGlow, borderRadius: Radius.md,
        padding: 12, borderWidth: 1, borderColor: Colors.borderActive,
    },
    actionLabel: { fontSize: Fonts.xs, color: Colors.primary, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
    actionText: { fontSize: Fonts.sm, color: Colors.textPrimary },
    waNote: {
        backgroundColor: "rgba(0,210,131,0.12)", borderRadius: Radius.md,
        paddingHorizontal: 16, paddingVertical: 10, marginBottom: 20,
        borderWidth: 1, borderColor: "rgba(0,210,131,0.3)",
    },
    waNoteText: { color: "#00D283", fontSize: Fonts.sm, fontWeight: "600" },
    reportAnotherBtn: {
        borderWidth: 1, borderColor: Colors.border,
        borderRadius: Radius.lg, padding: 16, alignItems: "center", width: "100%",
    },
    reportAnotherText: { color: Colors.textSecondary, fontSize: Fonts.md, fontWeight: "600" },
});