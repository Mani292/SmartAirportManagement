import React, { useState } from "react";
import {
    View, Text, ScrollView, StyleSheet,
    SafeAreaView, TouchableOpacity, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform
} from "react-native";
import { updateIncident, askKB, summarizeResolution } from "../../services/api";
import { Incident } from "../../types";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Colors, Fonts, Radius } from "../../theme";
import PriorityBadge from "../../components/PriorityBadge";

const STATE_CFG: Record<string, { label: string; color: string; icon: string }> = {
    "1": { label: "New", color: "#FF8C00", icon: "●" },
    "2": { label: "In Progress", color: "#00B4FF", icon: "◆" },
    "3": { label: "On Hold", color: "#8896A9", icon: "⏸" },
    "6": { label: "Resolved", color: "#00D283", icon: "✓" },
};

export default function TaskDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { incident }: { incident: Incident } = route.params;

    const [notes, setNotes] = useState("");
    const [kbQuestion, setKbQuestion] = useState("");
    const [kbAnswer, setKbAnswer] = useState("");
    const [summary, setSummary] = useState("");
    const [updating, setUpdating] = useState(false);
    const [loadingKB, setLoadingKB] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [resolved, setResolved] = useState(incident.state === "6");

    const state = STATE_CFG[incident.state] || { label: incident.state, color: "#888", icon: "◎" };

    const handleUpdateState = async (newState: string) => {
        setUpdating(true);
        try {
            await updateIncident(incident.sys_id, { state: newState, work_notes: notes || undefined });
            Alert.alert("Updated!", `Task moved to ${STATE_CFG[newState]?.label || newState}`);
            if (newState === "6") setResolved(true);
            if (route.params?.onRefresh) route.params.onRefresh();
            navigation.goBack();
        } catch { Alert.alert("Error", "Could not update task."); }
        finally { setUpdating(false); }
    };

    const handleKB = async () => {
        if (!kbQuestion.trim()) return;
        setLoadingKB(true); setKbAnswer("");
        try {
            const res = await askKB(kbQuestion.trim(), incident.u_ai_category || "General", incident.short_description);
            setKbAnswer(res.data.answer);
        } catch { setKbAnswer("Could not reach AI. Please try again."); }
        finally { setLoadingKB(false); }
    };

    const handleSummarize = async () => {
        if (!notes.trim()) { Alert.alert("Add Notes", "Please add resolution notes first."); return; }
        setLoadingSummary(true); setSummary("");
        try {
            const res = await summarizeResolution(incident.short_description, notes);
            setSummary(res.data.summary);
        } catch { setSummary("Could not generate summary. Please try again."); }
        finally { setLoadingSummary(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Text style={styles.backText}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Task Details</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Incident Card */}
                    <View style={styles.incCard}>
                        {incident.u_safety_risk === "true" && (
                            <View style={styles.safetyTag}>
                                <Text style={styles.safetyText}>⚠  SAFETY RISK — EXTREME CARE</Text>
                            </View>
                        )}
                        <View style={styles.incTop}>
                            <Text style={styles.incNumber}>{incident.number}</Text>
                            <PriorityBadge priority={incident.priority} size="md" />
                        </View>
                        <Text style={styles.incDesc}>{incident.short_description}</Text>

                        <View style={styles.metaBox}>
                            <View style={styles.metaRow}>
                                <MetaItem label="Location" value={`${incident.location} ${incident.u_area ? `· ${incident.u_area}` : ""}`} />
                            </View>
                            <View style={styles.metaRow}>
                                <MetaItem label="Category" value={incident.u_ai_category} />
                                <MetaItem label="Est. Fix" value={`${incident.u_estimated_fix_mins}m`} />
                            </View>
                            <View style={styles.metaRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.metaLabel}>STATUS</Text>
                                    <View style={[styles.statePill, { backgroundColor: state.color + "18", borderColor: state.color + "40" }]}>
                                        <Text style={[styles.stateText, { color: state.color }]}>{state.icon} {state.label}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {incident.u_recommended_action && (
                            <View style={styles.actionBox}>
                                <Text style={styles.actionLabel}>AI Recommendation</Text>
                                <Text style={styles.actionText}>{incident.u_recommended_action}</Text>
                            </View>
                        )}
                    </View>

                    {/* Knowledge Base */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>🤖</Text>
                            <Text style={styles.sectionTitle}>AI Assistant</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={kbQuestion}
                            onChangeText={setKbQuestion}
                            placeholder="Need help fixing this? Ask me..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                        />
                        <TouchableOpacity style={[styles.kbBtn, loadingKB && { opacity: 0.5 }]} onPress={handleKB} disabled={loadingKB}>
                            <Text style={styles.kbBtnText}>{loadingKB ? "Thinking..." : "Ask Question"}</Text>
                        </TouchableOpacity>
                        {kbAnswer ? (
                            <View style={styles.kbAnswerBox}>
                                <Text style={styles.kbAnswerText}>{kbAnswer}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Resolution */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>📝</Text>
                            <Text style={styles.sectionTitle}>Work Notes</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Document your fix..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                        />
                        <TouchableOpacity style={[styles.summaryBtn, loadingSummary && { opacity: 0.5 }]} onPress={handleSummarize} disabled={loadingSummary}>
                            <Text style={styles.summaryBtnText}>{loadingSummary ? "Generating AI Summary..." : "✨ Generate Tech Summary"}</Text>
                        </TouchableOpacity>
                        {summary ? (
                            <View style={styles.summaryBox}>
                                <Text style={styles.summaryBoxLabel}>FINAL SUMMARY</Text>
                                <Text style={styles.summaryBoxText}>{summary}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Actions */}
                    {!resolved ? (
                        <View style={styles.actions}>
                            <Text style={styles.actionsTitle}>UPDATE TASK STATUS</Text>
                            <View style={styles.actionsGrid}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => handleUpdateState("2")} disabled={updating}>
                                    <Text style={styles.actionBtnText}>In Progress</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#8896A9" }]} onPress={() => handleUpdateState("3")} disabled={updating}>
                                    <Text style={styles.actionBtnText}>On Hold</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#00D283", marginTop: 10 }]} onPress={() => handleUpdateState("6")} disabled={updating}>
                                <Text style={[styles.actionBtnText, { color: Colors.bg }]}>✓ Mark Resolved</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.resolvedBanner}>
                            <Text style={styles.resolvedText}>✓ Task Successfully Resolved</Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function MetaItem({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value || "—"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: 20, paddingBottom: 60 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
    backText: { color: Colors.textSecondary, fontSize: 18, fontWeight: "700" },
    headerTitle: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.textPrimary },
    incCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    safetyTag: { backgroundColor: "rgba(255,59,92,0.15)", borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: "flex-start", marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,59,92,0.3)" },
    safetyText: { color: "#FF3B5C", fontSize: Fonts.xs, fontWeight: "800", letterSpacing: 0.5 },
    incTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    incNumber: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.primary },
    incDesc: { fontSize: Fonts.md, color: Colors.textPrimary, lineHeight: 24, marginBottom: 16 },
    metaBox: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 12 },
    metaRow: { flexDirection: "row", gap: 12 },
    metaLabel: { fontSize: 9, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    metaValue: { fontSize: Fonts.sm, color: Colors.textPrimary, fontWeight: "500" },
    statePill: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
    stateText: { fontSize: Fonts.xs, fontWeight: "700" },
    actionBox: { backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: 12, marginTop: 16, borderWidth: 1, borderColor: Colors.borderActive },
    actionLabel: { fontSize: Fonts.xs, color: Colors.primary, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
    actionText: { fontSize: Fonts.sm, color: Colors.textPrimary },
    section: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
    sectionIcon: { fontSize: 18 },
    sectionTitle: { fontSize: Fonts.md, fontWeight: "800", color: Colors.textPrimary },
    input: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, color: Colors.textPrimary, fontSize: Fonts.sm, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
    kbBtn: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
    kbBtnText: { color: Colors.primary, fontWeight: "700", fontSize: Fonts.sm },
    kbAnswerBox: { backgroundColor: "rgba(0,180,255,0.08)", borderRadius: Radius.md, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "rgba(0,180,255,0.2)" },
    kbAnswerText: { fontSize: Fonts.sm, color: Colors.primary, lineHeight: 22 },
    summaryBtn: { backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.borderActive },
    summaryBtnText: { color: Colors.primary, fontWeight: "700", fontSize: Fonts.sm },
    summaryBox: { backgroundColor: "rgba(124,58,237,0.1)", borderRadius: Radius.md, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "rgba(124,58,237,0.3)" },
    summaryBoxLabel: { fontSize: 9, color: "#7C3AED", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    summaryBoxText: { fontSize: Fonts.sm, color: Colors.textPrimary, lineHeight: 22 },
    actions: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 20, borderWidth: 1, borderColor: Colors.border },
    actionsTitle: { fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, textAlign: "center" },
    actionsGrid: { flexDirection: "row", gap: 10 },
    actionBtn: { flex: 1, padding: 16, borderRadius: Radius.md, alignItems: "center" },
    actionBtnText: { color: "#fff", fontWeight: "800", fontSize: Fonts.md },
    resolvedBanner: { backgroundColor: "rgba(0,210,131,0.15)", borderRadius: Radius.lg, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(0,210,131,0.3)" },
    resolvedText: { color: "#00D283", fontWeight: "800", fontSize: Fonts.lg },
});
