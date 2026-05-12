import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, FlatList, StyleSheet,
    SafeAreaView, TouchableOpacity, RefreshControl, StatusBar, Alert
} from "react-native";
import { getMyTasks, getMyStats } from "../../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Incident } from "../../types";
import { useNavigation } from "@react-navigation/native";
import { Colors, Fonts, Radius } from "../../theme";

const STATE_CFG: Record<string, { label: string; color: string }> = {
    "1": { label: "New", color: "#FF8C00" },
    "2": { label: "In Progress", color: "#00B4FF" },
    "3": { label: "On Hold", color: "#8896A9" },
};

const PRIORITY_COLORS: Record<string, string> = {
    "1": "#FF3B5C", "2": "#FF8C00", "3": "#00B4FF", "4": "#00D283",
};

export default function MyTasksScreen() {
    const [tasks, setTasks] = useState<Incident[]>([]);
    const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, resolution_rate: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const userId = useSelector((state: RootState) => state.auth.userId);
    const username = useSelector((state: RootState) => state.auth.username);
    const navigation = useNavigation<any>();

    const load = useCallback(async () => {
        try {
            const [tasksRes, statsRes] = await Promise.all([
                getMyTasks(userId),
                getMyStats(userId),
            ]);
            setTasks(tasksRes.data?.result || []);
            setStats(statsRes.data || { total: 0, resolved: 0, pending: 0, resolution_rate: 0 });
        } catch { Alert.alert("Error", "Could not load your tasks."); }
        finally { setLoading(false); setRefreshing(false); }
    }, [userId]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = () => { setRefreshing(true); load(); };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome, {username}</Text>
                    <Text style={styles.headerSub}>Your assigned tasks</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity style={styles.arButton} onPress={() => navigation.navigate("ARScanner")}>
                        <Text style={styles.arButtonText}>AR Scan</Text>
                    </TouchableOpacity>
                    <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{username?.[0] || "T"}</Text>
                    </View>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <StatBox value={stats.total} label="Total" color={Colors.primary} />
                <StatBox value={stats.pending} label="Pending" color="#FF8C00" />
                <StatBox value={stats.resolved} label="Resolved" color="#00D283" />
                <StatBox value={`${stats.resolution_rate}%`} label="Rate" color="#7C3AED" />
            </View>

            {/* Task List */}
            <FlatList
                data={tasks}
                keyExtractor={item => item.sys_id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyIconText}>✓</Text>
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptyText}>{loading ? "Loading tasks..." : "No open tasks assigned to you"}</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const state = STATE_CFG[item.state];
                    const pColor = PRIORITY_COLORS[item.priority] || "#888";
                    return (
                        <TouchableOpacity
                            style={[styles.taskCard, { borderLeftColor: pColor }]}
                            onPress={() => navigation.navigate("TaskDetail", { incident: item, onRefresh: load })}
                            activeOpacity={0.85}
                        >
                            {item.u_safety_risk === "true" && (
                                <View style={styles.safetyTag}>
                                    <Text style={styles.safetyTagText}>⚠  SAFETY RISK</Text>
                                </View>
                            )}
                            <View style={styles.cardTop}>
                                <Text style={styles.incNumber}>{item.number}</Text>
                                <View style={[styles.priorityPill, { backgroundColor: pColor + "20", borderColor: pColor + "50" }]}>
                                    <View style={[styles.priorityDot, { backgroundColor: pColor }]} />
                                    <Text style={[styles.priorityText, { color: pColor }]}>P{item.priority}</Text>
                                </View>
                            </View>
                            <Text style={styles.desc} numberOfLines={2}>{item.short_description}</Text>
                            <View style={styles.metaRow}>
                                <MetaChip text={item.location} icon="◎" />
                                {item.u_area ? <MetaChip text={item.u_area} icon="◈" /> : null}
                                {item.u_estimated_fix_mins ? <MetaChip text={`${item.u_estimated_fix_mins}m`} icon="⏱" /> : null}
                            </View>
                            <View style={styles.cardBottom}>
                                {state && (
                                    <View style={[styles.statePill, { backgroundColor: state.color + "18", borderColor: state.color + "40" }]}>
                                        <View style={[styles.stateDot, { backgroundColor: state.color }]} />
                                        <Text style={[styles.stateText, { color: state.color }]}>{state.label}</Text>
                                    </View>
                                )}
                                {item.u_recommended_action ? (
                                    <Text style={styles.actionHint} numberOfLines={1}>⚡ {item.u_recommended_action}</Text>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </SafeAreaView>
    );
}

function StatBox({ value, label, color }: { value: string | number; label: string; color: string }) {
    return (
        <View style={[styles.statBox, { borderTopColor: color }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function MetaChip({ text, icon }: { text: string; icon: string }) {
    return (
        <View style={styles.metaChip}>
            <Text style={styles.metaIcon}>{icon}</Text>
            <Text style={styles.metaText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
    },
    greeting: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -0.5 },
    headerSub: { fontSize: Fonts.sm, color: Colors.primary, fontWeight: "600", marginTop: 4, letterSpacing: 0.5 },
    avatarWrap: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: Colors.primaryGlow,
        borderWidth: 1.5, borderColor: Colors.borderActive,
        alignItems: "center", justifyContent: "center",
    },
    avatarText: { color: Colors.primary, fontSize: Fonts.lg, fontWeight: "800" },
    arButton: {
        backgroundColor: "rgba(100, 255, 218, 0.15)",
        borderWidth: 1, borderColor: "#64FFDA",
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: Radius.full,
    },
    arButtonText: { color: "#64FFDA", fontWeight: "700", fontSize: Fonts.sm },
    statsRow: {
        flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 24,
    },
    statBox: {
        flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 16, alignItems: "center", borderTopWidth: 3,
        borderWidth: 1, borderColor: Colors.border,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    statValue: { fontSize: 24, fontWeight: "900" },
    statLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 4, textTransform: "uppercase", fontWeight: "700", letterSpacing: 1 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
        padding: 40, alignItems: "center", gap: 10,
        borderWidth: 1, borderColor: Colors.border, marginTop: 20,
    },
    emptyIconText: { fontSize: 48, color: "#00D283", fontWeight: "800" },
    emptyTitle: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.textPrimary },
    emptyText: { fontSize: Fonts.sm, color: Colors.textMuted },
    taskCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.md,
        padding: 16, marginBottom: 10,
        borderLeftWidth: 4, borderWidth: 1, borderColor: Colors.border,
    },
    safetyTag: {
        backgroundColor: "rgba(255,59,92,0.15)",
        borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
        alignSelf: "flex-start", marginBottom: 10,
        borderWidth: 1, borderColor: "rgba(255,59,92,0.3)",
    },
    safetyTagText: { color: "#FF3B5C", fontSize: Fonts.xs, fontWeight: "800", letterSpacing: 0.5 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    incNumber: { fontSize: Fonts.sm, fontWeight: "700", color: Colors.primary },
    priorityPill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: Radius.full, borderWidth: 1,
    },
    priorityDot: { width: 6, height: 6, borderRadius: 3 },
    priorityText: { fontSize: Fonts.xs, fontWeight: "700" },
    desc: { fontSize: Fonts.md, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
    metaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 },
    metaChip: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: Colors.bgElevated,
        borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4,
    },
    metaIcon: { fontSize: 10, color: Colors.textMuted },
    metaText: { fontSize: Fonts.xs, color: Colors.textSecondary },
    cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    statePill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: Radius.full, borderWidth: 1,
    },
    stateDot: { width: 6, height: 6, borderRadius: 3 },
    stateText: { fontSize: Fonts.xs, fontWeight: "700" },
    actionHint: { flex: 1, fontSize: Fonts.xs, color: Colors.primary, marginLeft: 8 },
});
