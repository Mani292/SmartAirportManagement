import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, ScrollView, StyleSheet,
    SafeAreaView, TouchableOpacity, RefreshControl, StatusBar, Alert
} from "react-native";
import { getIncidents } from "../../services/api";
import StatCard from "../../components/StatCard";
import IncidentCard from "../../components/IncidentCard";
import { Incident } from "../../types";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Colors, Fonts, Radius } from "../../theme";

export default function DashboardScreen() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const username = useSelector((state: RootState) => state.auth.username);

    const load = useCallback(async () => {
        try {
            const res = await getIncidents(100);
            setIncidents(res.data?.result || []);
        } catch { Alert.alert("Error", "Could not load incidents."); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = () => { setRefreshing(true); load(); };

    const total = incidents.length;
    const open = incidents.filter(i => ["1", "2"].includes(i.state)).length;
    const resolved = incidents.filter(i => i.state === "6").length;
    const critical = incidents.filter(i => i.priority === "1").length;
    const safetyRisks = incidents.filter(i => i.u_safety_risk === "true").length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const recent = [...incidents]
        .sort((a, b) => b.sys_created_on.localeCompare(a.sys_created_on))
        .slice(0, 6);

    const priorityData = ["1", "2", "3", "4"].map(p => ({
        label: ["Critical", "High", "Medium", "Low"][Number(p) - 1],
        count: incidents.filter(i => i.priority === p).length,
        color: ["#FF3B5C", "#FF8C00", "#00B4FF", "#00D283"][Number(p) - 1],
    }));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good day, {username}</Text>
                        <Text style={styles.headerSub}>Operations Dashboard</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <Text style={styles.refreshText}>↺</Text>
                    </TouchableOpacity>
                </View>

                {/* Safety Alert */}
                {safetyRisks > 0 && (
                    <View style={styles.safetyBanner}>
                        <Text style={styles.safetyIcon}>⚠</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.safetyTitle}>{safetyRisks} Active Safety Risk{safetyRisks > 1 ? "s" : ""}</Text>
                            <Text style={styles.safetyDesc}>Immediate attention required</Text>
                        </View>
                        <View style={styles.safetyPulse} />
                    </View>
                )}

                {/* KPI Row 1 */}
                <Text style={styles.sectionLabel}>OVERVIEW</Text>
                <View style={styles.statsRow}>
                    <StatCard title="Total" value={total} icon="◈" color={Colors.primary} />
                    <StatCard title="Active" value={open} icon="⚡" color="#FF8C00" />
                </View>
                <View style={styles.statsRow}>
                    <StatCard title="Resolved" value={resolved} icon="✓" color="#00D283" />
                    <StatCard title="Critical" value={critical} icon="⚠" color="#FF3B5C" />
                </View>

                {/* Resolution Rate */}
                <View style={styles.rateCard}>
                    <View style={styles.rateLeft}>
                        <Text style={styles.rateValue}>{resolutionRate}%</Text>
                        <Text style={styles.rateLabel}>Resolution Rate</Text>
                    </View>
                    <View style={styles.rateBar}>
                        <View style={[styles.rateFill, { width: `${resolutionRate}%` as any }]} />
                    </View>
                </View>

                {/* Priority Breakdown */}
                <Text style={styles.sectionLabel}>PRIORITY BREAKDOWN</Text>
                <View style={styles.priorityGrid}>
                    {priorityData.map((p) => (
                        <View key={p.label} style={[styles.priorityCard, { borderColor: p.color + "30" }]}>
                            <Text style={[styles.priorityCount, { color: p.color }]}>{p.count}</Text>
                            <Text style={styles.priorityLabel}>{p.label}</Text>
                            <View style={[styles.priorityBar, { backgroundColor: p.color + "20" }]}>
                                <View style={[styles.priorityFill, {
                                    width: total > 0 ? `${(p.count / total) * 100}%` as any : "0%",
                                    backgroundColor: p.color
                                }]} />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Recent Incidents */}
                <Text style={styles.sectionLabel}>RECENT INCIDENTS</Text>
                {loading ? (
                    <Text style={styles.loadingText}>Fetching incidents...</Text>
                ) : recent.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyIcon}>✓</Text>
                        <Text style={styles.emptyText}>All clear — no incidents</Text>
                    </View>
                ) : (
                    recent.map(inc => <IncidentCard key={inc.sys_id} incident={inc} />)
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: 20, paddingBottom: 40 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    greeting: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.textPrimary },
    headerSub: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },
    refreshBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: Colors.bgCard,
        borderWidth: 1, borderColor: Colors.border,
        alignItems: "center", justifyContent: "center",
    },
    refreshText: { color: Colors.primary, fontSize: 18, fontWeight: "700" },
    safetyBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,59,92,0.1)",
        borderRadius: Radius.md,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,59,92,0.3)",
        marginBottom: 20,
        gap: 12,
    },
    safetyIcon: { fontSize: 20, color: "#FF3B5C" },
    safetyTitle: { color: "#FF3B5C", fontWeight: "800", fontSize: Fonts.md },
    safetyDesc: { color: "rgba(255,59,92,0.7)", fontSize: Fonts.xs, marginTop: 2 },
    safetyPulse: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: "#FF3B5C",
    },
    sectionLabel: {
        fontSize: Fonts.xs,
        fontWeight: "700",
        color: Colors.textMuted,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 12,
        marginTop: 20,
    },
    statsRow: { flexDirection: "row", marginBottom: 2 },
    rateCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    rateLeft: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    rateValue: { fontSize: Fonts.xxxl, fontWeight: "800", color: "#00D283" },
    rateLabel: { fontSize: Fonts.sm, color: Colors.textSecondary },
    rateBar: {
        height: 6,
        backgroundColor: Colors.bgElevated,
        borderRadius: 3,
        overflow: "hidden",
    },
    rateFill: {
        height: "100%",
        backgroundColor: "#00D283",
        borderRadius: 3,
    },
    priorityGrid: { flexDirection: "row", gap: 8 },
    priorityCard: {
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: 12,
        borderWidth: 1,
        alignItems: "center",
        gap: 4,
    },
    priorityCount: { fontSize: Fonts.xxl, fontWeight: "800" },
    priorityLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: "600" },
    priorityBar: {
        width: "100%",
        height: 4,
        borderRadius: 2,
        marginTop: 4,
        overflow: "hidden",
    },
    priorityFill: { height: "100%", borderRadius: 2 },
    loadingText: { color: Colors.textMuted, textAlign: "center", marginTop: 20, fontSize: Fonts.sm },
    emptyCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: 30,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 8,
    },
    emptyIcon: { fontSize: 32, color: "#00D283" },
    emptyText: { color: Colors.textSecondary, fontSize: Fonts.md },
});
