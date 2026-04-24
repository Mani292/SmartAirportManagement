import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView, StatusBar, Alert
} from "react-native";
import { trackIncident } from "../../services/api";
import PriorityBadge from "../../components/PriorityBadge";
import { Colors, Fonts, Radius } from "../../theme";

const STATE_CFG: Record<string, { label: string; desc: string; color: string; icon: string }> = {
    "1": { label: "New", desc: "Report received · Awaiting assignment", color: "#FF8C00", icon: "●" },
    "2": { label: "In Progress", desc: "Technician is actively working on this", color: "#00B4FF", icon: "◆" },
    "3": { label: "On Hold", desc: "Temporarily paused — pending parts or info", color: "#8896A9", icon: "⏸" },
    "6": { label: "Resolved", desc: "Issue has been fixed!", color: "#00D283", icon: "✓" },
    "7": { label: "Closed", desc: "Issue closed", color: "#4A5568", icon: "✕" },
};

const TIMELINE_STEPS = [
    { key: "1", label: "Reported" },
    { key: "2", label: "In Progress" },
    { key: "6", label: "Resolved" },
];

export default function TrackIssueScreen() {
    const [number, setNumber] = useState("");
    const [incident, setIncident] = useState<any>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [rated, setRated] = useState(false);

    const handleTrack = async () => {
        if (!number.trim()) { Alert.alert("Enter incident number"); return; }
        setLoading(true);
        setNotFound(false);
        setIncident(null);
        try {
            const res = await trackIncident(number.trim().toUpperCase());
            if (res.data?.result?.length > 0) {
                setIncident(res.data.result[0]);
            } else {
                setNotFound(true);
            }
        } catch { Alert.alert("Error", "Could not fetch incident."); }
        finally { setLoading(false); }
    };

    const state = incident ? STATE_CFG[incident.state] : null;
    const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === incident?.state);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <Text style={styles.heading}>Track Issue</Text>
                <Text style={styles.headingSub}>Enter your incident number to check status</Text>

                {/* Search */}
                <View style={styles.searchCard}>
                    <TextInput
                        style={styles.searchInput}
                        value={number}
                        onChangeText={t => setNumber(t)}
                        placeholder="INC0001234"
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="characters"
                        returnKeyType="search"
                        onSubmitEditing={handleTrack}
                    />
                    <TouchableOpacity
                        style={[styles.searchBtn, loading && { opacity: 0.5 }]}
                        onPress={handleTrack}
                        disabled={loading}
                    >
                        <Text style={styles.searchBtnText}>{loading ? "..." : "Track"}</Text>
                    </TouchableOpacity>
                </View>

                {notFound && (
                    <View style={styles.notFoundCard}>
                        <Text style={styles.notFoundIcon}>◎</Text>
                        <Text style={styles.notFoundTitle}>Not Found</Text>
                        <Text style={styles.notFoundText}>Check the incident number and try again</Text>
                    </View>
                )}

                {incident && state && (
                    <>
                        {/* Status Card */}
                        <View style={[styles.statusCard, { borderColor: state.color + "30" }]}>
                            <View style={styles.statusTop}>
                                <View>
                                    <Text style={styles.incNumber}>{incident.number}</Text>
                                    <Text style={styles.incDesc} numberOfLines={2}>{incident.short_description}</Text>
                                </View>
                                <PriorityBadge priority={incident.priority} />
                            </View>

                            {/* Current state */}
                            <View style={[styles.stateBox, { backgroundColor: state.color + "18", borderColor: state.color + "30" }]}>
                                <Text style={[styles.stateIcon, { color: state.color }]}>{state.icon}</Text>
                                <View>
                                    <Text style={[styles.stateLabel, { color: state.color }]}>{state.label}</Text>
                                    <Text style={styles.stateDesc}>{state.desc}</Text>
                                </View>
                            </View>

                            {/* Timeline */}
                            <View style={styles.timeline}>
                                {TIMELINE_STEPS.map((step, idx) => {
                                    const isDone = currentStepIndex >= idx;
                                    const isCurrent = currentStepIndex === idx;
                                    return (
                                        <View key={step.key} style={styles.timelineStep}>
                                            <View style={[
                                                styles.timelineNode,
                                                { borderColor: isDone ? state.color : Colors.border },
                                                isDone && { backgroundColor: state.color + "30" }
                                            ]}>
                                                {isDone && <View style={[styles.timelineNodeFill, { backgroundColor: state.color }]} />}
                                            </View>
                                            <Text style={[styles.timelineLabel, isCurrent && { color: state.color, fontWeight: "700" }]}>{step.label}</Text>
                                            {idx < TIMELINE_STEPS.length - 1 && (
                                                <View style={[styles.timelineLine, { backgroundColor: isDone ? state.color + "60" : Colors.border }]} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Details */}
                        <View style={styles.detailsCard}>
                            <Text style={styles.detailsTitle}>Incident Details</Text>
                            <DetailRow label="Location" value={`${incident.location}${incident.u_area ? " · " + incident.u_area : ""}`} />
                            <DetailRow label="Category" value={incident.u_ai_category} />
                            <DetailRow label="Estimated Fix" value={incident.u_estimated_fix_mins ? `${incident.u_estimated_fix_mins} minutes` : undefined} />
                            {incident.u_safety_risk === "true" && (
                                <View style={styles.safetyNote}>
                                    <Text style={styles.safetyNoteText}>⚠  This is marked as a safety risk — Priority response</Text>
                                </View>
                            )}
                        </View>

                        {/* Rating (resolved only) */}
                        {incident.state === "6" && (
                            <View style={styles.ratingCard}>
                                {!rated ? (
                                    <>
                                        <Text style={styles.ratingTitle}>How was the resolution?</Text>
                                        <Text style={styles.ratingSub}>Your feedback improves our service</Text>
                                        <View style={styles.stars}>
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <TouchableOpacity
                                                    key={s}
                                                    onPress={() => { setRating(s); setRated(true); Alert.alert("Thank you!", `You rated ${s}/5 ⭐`); }}
                                                >
                                                    <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.ratedBox}>
                                        <Text style={styles.ratedText}>Thank you for your feedback! ⭐ {rating}/5</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
            <Text style={{ fontSize: Fonts.sm, color: Colors.textPrimary, marginTop: 2 }}>{value || "—"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: 20, paddingBottom: 50 },
    heading: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    headingSub: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
    searchCard: {
        flexDirection: "row", gap: 10,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg, padding: 6,
        borderWidth: 1, borderColor: Colors.border,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1, fontSize: Fonts.lg, fontWeight: "700",
        color: Colors.textPrimary, paddingHorizontal: 12, paddingVertical: 10,
        letterSpacing: 1,
    },
    searchBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.md,
        paddingHorizontal: 20, justifyContent: "center",
    },
    searchBtnText: { color: Colors.bg, fontWeight: "800", fontSize: Fonts.md },
    notFoundCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 30, alignItems: "center", gap: 8,
        borderWidth: 1, borderColor: Colors.border,
    },
    notFoundIcon: { fontSize: 40, color: Colors.textMuted },
    notFoundTitle: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.textPrimary },
    notFoundText: { fontSize: Fonts.sm, color: Colors.textMuted, textAlign: "center" },
    statusCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 20, marginBottom: 12,
        borderWidth: 1,
    },
    statusTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    incNumber: { fontSize: Fonts.sm, fontWeight: "700", color: Colors.primary, marginBottom: 4 },
    incDesc: { fontSize: Fonts.md, color: Colors.textPrimary, maxWidth: "80%" },
    stateBox: {
        flexDirection: "row", alignItems: "center", gap: 12,
        borderRadius: Radius.md, padding: 14,
        borderWidth: 1, marginBottom: 20,
    },
    stateIcon: { fontSize: 22, fontWeight: "700" },
    stateLabel: { fontSize: Fonts.md, fontWeight: "800" },
    stateDesc: { fontSize: Fonts.xs, color: Colors.textSecondary, marginTop: 2 },
    // Timeline
    timeline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    timelineStep: { alignItems: "center", flex: 1, position: "relative" },
    timelineNode: {
        width: 18, height: 18, borderRadius: 9,
        borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4,
    },
    timelineNodeFill: { width: 8, height: 8, borderRadius: 4 },
    timelineLabel: { fontSize: 9, color: Colors.textMuted, textAlign: "center" },
    timelineLine: {
        position: "absolute",
        top: 9, left: "50%", right: "-50%",
        height: 2, zIndex: -1,
    },
    detailsCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 20, marginBottom: 12,
        borderWidth: 1, borderColor: Colors.border,
    },
    detailsTitle: { fontSize: Fonts.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 14 },
    safetyNote: {
        backgroundColor: "rgba(255,59,92,0.1)", borderRadius: Radius.md,
        padding: 12, marginTop: 8,
        borderWidth: 1, borderColor: "rgba(255,59,92,0.3)",
    },
    safetyNoteText: { color: "#FF3B5C", fontSize: Fonts.sm, fontWeight: "700" },
    ratingCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 20, alignItems: "center",
        borderWidth: 1, borderColor: Colors.border,
    },
    ratingTitle: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.textPrimary, marginBottom: 4 },
    ratingSub: { fontSize: Fonts.xs, color: Colors.textMuted, marginBottom: 16 },
    stars: { flexDirection: "row", gap: 10 },
    star: { fontSize: 38, color: Colors.bgElevated },
    starActive: { color: "#FFB800" },
    ratedBox: { padding: 10 },
    ratedText: { color: "#00D283", fontSize: Fonts.md, fontWeight: "700" },
});