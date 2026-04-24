import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, FlatList, StyleSheet,
    SafeAreaView, TouchableOpacity, TextInput,
    Modal, Alert, StatusBar, RefreshControl
} from "react-native";
import { getIncidents, updateIncident } from "../../services/api";
import PriorityBadge from "../../components/PriorityBadge";
import { Incident } from "../../types";
import { Colors, Fonts, Radius } from "../../theme";

const DEPTS = ["All", "Facilities", "IT", "Security", "Housekeeping", "Ground Ops", "HR"];
const STATES: Record<string, string> = { "1": "New", "2": "In Progress", "3": "On Hold", "6": "Resolved" };
const STATE_COLORS: Record<string, string> = { "1": "#FF8C00", "2": "#00B4FF", "3": "#8896A9", "6": "#00D283" };

export default function IncidentListScreen() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [filtered, setFiltered] = useState<Incident[]>([]);
    const [search, setSearch] = useState("");
    const [dept, setDept] = useState("All");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selected, setSelected] = useState<Incident | null>(null);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await getIncidents(100);
            const data = res.data?.result || [];
            setIncidents(data);
            setFiltered(data);
        } catch { Alert.alert("Error", "Could not load incidents."); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        let data = incidents;
        if (dept !== "All") data = data.filter(i => i.u_department === dept || i.u_ai_category?.includes(dept));
        if (search) data = data.filter(i =>
            i.number.toLowerCase().includes(search.toLowerCase()) ||
            i.short_description.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(data);
    }, [search, dept, incidents]);

    const handleUpdate = async (state: string) => {
        if (!selected) return;
        setUpdating(true);
        try {
            await updateIncident(selected.sys_id, { state, work_notes: notes || undefined });
            Alert.alert("Updated", `Status → ${STATES[state]}`);
            setSelected(null);
            setNotes("");
            setRefreshing(true);
            load();
        } catch { Alert.alert("Error", "Update failed."); }
        finally { setUpdating(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Incidents</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{filtered.length}</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search incidents..."
                    placeholderTextColor={Colors.textMuted}
                />
                {search ? (
                    <TouchableOpacity onPress={() => setSearch("")}>
                        <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Dept Filter */}
            <FlatList
                horizontal
                data={DEPTS}
                keyExtractor={d => d}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.filterChip, dept === item && styles.filterChipActive]}
                        onPress={() => setDept(item)}
                    >
                        <Text style={[styles.filterText, dept === item && styles.filterTextActive]}>{item}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={i => i.sys_id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>◈</Text>
                        <Text style={styles.emptyText}>{loading ? "Loading..." : "No incidents found"}</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const stateColor = STATE_COLORS[item.state] || "#888";
                    return (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => { setSelected(item); setNotes(""); }}
                            activeOpacity={0.8}
                        >
                            <View style={styles.rowLeft}>
                                <View style={[styles.rowDot, { backgroundColor: stateColor }]} />
                            </View>
                            <View style={styles.rowBody}>
                                <View style={styles.rowTop}>
                                    <Text style={styles.rowNumber}>{item.number}</Text>
                                    <PriorityBadge priority={item.priority} />
                                </View>
                                <Text style={styles.rowDesc} numberOfLines={1}>{item.short_description}</Text>
                                <View style={styles.rowMeta}>
                                    <Text style={styles.rowMetaText}>{item.location}</Text>
                                    <Text style={styles.rowMetaDot}>·</Text>
                                    <Text style={[styles.rowState, { color: stateColor }]}>{STATES[item.state] || "—"}</Text>
                                </View>
                            </View>
                            <Text style={styles.rowArrow}>›</Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Detail Modal */}
            <Modal visible={!!selected} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalNumber}>{selected?.number}</Text>
                            {selected && <PriorityBadge priority={selected.priority} size="md" />}
                        </View>
                        <Text style={styles.modalDesc}>{selected?.short_description}</Text>
                        <View style={styles.modalMeta}>
                            <MetaRow label="Location" value={`${selected?.location} · ${selected?.u_area}`} />
                            <MetaRow label="Category" value={selected?.u_ai_category} />
                            <MetaRow label="Est. Fix" value={`${selected?.u_estimated_fix_mins || "—"} mins`} />
                        </View>
                        {selected?.u_recommended_action ? (
                            <View style={styles.aiBox}>
                                <Text style={styles.aiBoxLabel}>AI Recommendation</Text>
                                <Text style={styles.aiBoxText}>{selected.u_recommended_action}</Text>
                            </View>
                        ) : null}
                        <TextInput
                            style={styles.notesInput}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add work notes (optional)..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                        />
                        <View style={styles.statusBtns}>
                            {[{ state: "2", label: "In Progress", color: Colors.primary },
                              { state: "6", label: "Resolved", color: "#00D283" },
                              { state: "3", label: "On Hold", color: "#8896A9" }].map(b => (
                                <TouchableOpacity
                                    key={b.state}
                                    style={[styles.statusBtn, { backgroundColor: b.color + "20", borderColor: b.color + "50" }]}
                                    onPress={() => handleUpdate(b.state)}
                                    disabled={updating}
                                >
                                    <Text style={[styles.statusBtnText, { color: b.color }]}>{b.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function MetaRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <View style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
            <Text style={{ fontSize: Fonts.sm, color: Colors.textPrimary, marginTop: 1 }}>{value || "—"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    },
    title: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    countBadge: {
        backgroundColor: Colors.primaryGlow,
        borderRadius: Radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.borderActive,
    },
    countText: { color: Colors.primary, fontSize: Fonts.sm, fontWeight: "700" },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        marginHorizontal: 20,
        marginBottom: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 8,
    },
    searchIcon: { fontSize: 18, color: Colors.textMuted },
    searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Fonts.md, paddingVertical: 12 },
    clearBtn: { color: Colors.textMuted, fontSize: 14, padding: 4 },
    filterRow: { paddingHorizontal: 20, gap: 8, marginBottom: 12 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: Radius.full,
        backgroundColor: Colors.bgCard,
        borderWidth: 1, borderColor: Colors.border,
    },
    filterChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.borderActive },
    filterText: { fontSize: Fonts.sm, color: Colors.textSecondary, fontWeight: "600" },
    filterTextActive: { color: Colors.primary },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    empty: { alignItems: "center", paddingTop: 60, gap: 8 },
    emptyIcon: { fontSize: 40, color: Colors.textMuted },
    emptyText: { fontSize: Fonts.md, color: Colors.textMuted },
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        marginBottom: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    rowLeft: {
        width: 4,
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    rowDot: { width: 4, flex: 1, borderRadius: 0 },
    rowBody: { flex: 1, padding: 14 },
    rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    rowNumber: { fontSize: Fonts.sm, fontWeight: "700", color: Colors.primary },
    rowDesc: { fontSize: Fonts.sm, color: Colors.textPrimary, marginBottom: 6 },
    rowMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
    rowMetaText: { fontSize: Fonts.xs, color: Colors.textMuted },
    rowMetaDot: { color: Colors.textMuted, fontSize: 10 },
    rowState: { fontSize: Fonts.xs, fontWeight: "700" },
    rowArrow: { color: Colors.textMuted, fontSize: 20, paddingRight: 12 },
    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "flex-end",
    },
    modal: {
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: "center", marginBottom: 20,
    },
    modalHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 8,
    },
    modalNumber: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.primary },
    modalDesc: { fontSize: Fonts.md, color: Colors.textPrimary, lineHeight: 22, marginBottom: 16 },
    modalMeta: {
        backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14,
        gap: 8, marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
    },
    aiBox: {
        backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: 14,
        borderWidth: 1, borderColor: Colors.borderActive, marginBottom: 12,
    },
    aiBoxLabel: { fontSize: Fonts.xs, color: Colors.primary, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
    aiBoxText: { fontSize: Fonts.sm, color: Colors.textPrimary, lineHeight: 20 },
    notesInput: {
        backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
        padding: 12, color: Colors.textPrimary, fontSize: Fonts.sm,
        borderWidth: 1, borderColor: Colors.border, minHeight: 70,
        textAlignVertical: "top", marginBottom: 14,
    },
    statusBtns: { flexDirection: "row", gap: 8, marginBottom: 12 },
    statusBtn: {
        flex: 1, padding: 12, borderRadius: Radius.md,
        alignItems: "center", borderWidth: 1,
    },
    statusBtnText: { fontSize: Fonts.sm, fontWeight: "700" },
    closeBtn: {
        padding: 14, borderRadius: Radius.md,
        backgroundColor: Colors.bgElevated, alignItems: "center",
        borderWidth: 1, borderColor: Colors.border,
    },
    closeBtnText: { color: Colors.textSecondary, fontSize: Fonts.md, fontWeight: "600" },
});
