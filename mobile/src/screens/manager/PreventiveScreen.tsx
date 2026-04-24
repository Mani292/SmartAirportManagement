import React, { useState, useCallback, useEffect } from "react";
import {
    View, Text, FlatList, StyleSheet, SafeAreaView,
    TouchableOpacity, Modal, TextInput, Alert, StatusBar, RefreshControl
} from "react-native";
import { getPreventiveTasks, createPreventiveTask, updatePreventiveTask } from "../../services/api";
import { Colors, Fonts, Radius } from "../../theme";

interface Task {
    sys_id: string;
    u_title: string;
    u_asset_name: string;
    u_due_date: string;
    u_status: "scheduled" | "in_progress" | "completed" | "overdue";
    u_frequency: string;
    u_assigned_team: string;
    u_description: string;
}

const STATUS_CFG = {
    scheduled: { color: "#00B4FF", bg: "rgba(0,180,255,0.12)", label: "Scheduled" },
    in_progress: { color: "#FF8C00", bg: "rgba(255,140,0,0.12)", label: "In Progress" },
    completed: { color: "#00D283", bg: "rgba(0,210,131,0.12)", label: "Completed" },
    overdue: { color: "#FF3B5C", bg: "rgba(255,59,92,0.12)", label: "Overdue" },
};

const TEAMS = ["Facilities Team", "Electrical Team", "HVAC Team", "IT Support", "Security Team"];

export default function PreventiveScreen() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [selected, setSelected] = useState<Task | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ u_title: "", u_asset_name: "", u_description: "", u_frequency: "Monthly", u_assigned_team: TEAMS[0] });

    const load = useCallback(async () => {
        try {
            const res = await getPreventiveTasks();
            setTasks(res.data?.result || []);
        } catch { Alert.alert("Error", "Could not load tasks."); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const statusCounts = {
        scheduled: tasks.filter(t => t.u_status === "scheduled").length,
        in_progress: tasks.filter(t => t.u_status === "in_progress").length,
        overdue: tasks.filter(t => t.u_status === "overdue").length,
        completed: tasks.filter(t => t.u_status === "completed").length,
    };

    const handleAdd = async () => {
        if (!form.u_title || !form.u_asset_name) {
            Alert.alert("Missing", "Please enter title and asset name.");
            return;
        }
        setSaving(true);
        try {
            await createPreventiveTask({ ...form, u_status: "scheduled" });
            Alert.alert("Scheduled!", "Maintenance task created.");
            setShowAdd(false);
            setForm({ u_title: "", u_asset_name: "", u_description: "", u_frequency: "Monthly", u_assigned_team: TEAMS[0] });
            setRefreshing(true);
            load();
        } catch { Alert.alert("Error", "Could not create task."); }
        finally { setSaving(false); }
    };

    const handleComplete = async (task: Task) => {
        try {
            await updatePreventiveTask(task.sys_id, { u_status: "completed" });
            Alert.alert("Done!", "Task marked as completed.");
            setSelected(null);
            load();
        } catch { Alert.alert("Error", "Update failed."); }
    };

    const FREQS = ["Daily", "Weekly", "Monthly", "Quarterly", "Annually"];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Preventive Maint.</Text>
                    <Text style={styles.subtitle}>{tasks.length} total schedules</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
                    <Text style={styles.addBtnText}>+ Schedule</Text>
                </TouchableOpacity>
            </View>

            {/* Status Summary */}
            <View style={styles.summaryRow}>
                {Object.entries(statusCounts).map(([key, count]) => {
                    const cfg = STATUS_CFG[key as keyof typeof STATUS_CFG];
                    return (
                        <View key={key} style={[styles.summaryCard, { borderColor: cfg.color + "30" }]}>
                            <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
                            <Text style={styles.summaryLabel}>{cfg.label}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Task List */}
            <FlatList
                data={tasks}
                keyExtractor={t => t.sys_id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📅</Text>
                        <Text style={styles.emptyText}>{loading ? "Loading..." : "No maintenance schedules"}</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const cfg = STATUS_CFG[item.u_status] || STATUS_CFG.scheduled;
                    const isOverdue = item.u_status === "overdue";
                    return (
                        <TouchableOpacity
                            style={[styles.taskCard, isOverdue && styles.taskCardOverdue]}
                            onPress={() => setSelected(item)}
                            activeOpacity={0.85}
                        >
                            <View style={styles.taskLeft}>
                                <View style={[styles.freqBadge, { backgroundColor: "rgba(0,180,255,0.12)" }]}>
                                    <Text style={styles.freqText}>{(item.u_frequency || "Monthly")[0]}</Text>
                                </View>
                            </View>
                            <View style={styles.taskInfo}>
                                <Text style={styles.taskTitle}>{item.u_title}</Text>
                                <Text style={styles.taskAsset}>{item.u_asset_name}</Text>
                                <View style={styles.taskMeta}>
                                    <Text style={styles.taskTeam}>{item.u_assigned_team}</Text>
                                    {item.u_due_date ? <Text style={styles.taskDue}>Due {item.u_due_date.split(" ")[0]}</Text> : null}
                                </View>
                            </View>
                            <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color + "40" }]}>
                                <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Detail Modal */}
            {selected && (
                <Modal visible={!!selected} animationType="slide" transparent>
                    <View style={styles.overlay}>
                        <View style={styles.modal}>
                            <View style={styles.modalHandle} />
                            <Text style={styles.modalTitle}>{selected.u_title}</Text>
                            <View style={styles.modalMeta}>
                                <MetaRow label="Asset" value={selected.u_asset_name} />
                                <MetaRow label="Team" value={selected.u_assigned_team} />
                                <MetaRow label="Frequency" value={selected.u_frequency} />
                                <MetaRow label="Due Date" value={selected.u_due_date?.split(" ")[0]} />
                            </View>
                            {selected.u_description ? (
                                <View style={styles.descBox}>
                                    <Text style={styles.descLabel}>Description</Text>
                                    <Text style={styles.descText}>{selected.u_description}</Text>
                                </View>
                            ) : null}
                            {selected.u_status !== "completed" && (
                                <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(selected)}>
                                    <Text style={styles.completeBtnText}>✓ Mark as Completed</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                                <Text style={styles.closeBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Add Modal */}
            <Modal visible={showAdd} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Schedule Maintenance</Text>
                        <Text style={styles.inputLabel}>Task Title</Text>
                        <TextInput style={styles.input} value={form.u_title} onChangeText={v => setForm(f => ({ ...f, u_title: v }))} placeholder="e.g. Monthly Elevator Inspection" placeholderTextColor={Colors.textMuted} />
                        <Text style={styles.inputLabel}>Asset Name</Text>
                        <TextInput style={styles.input} value={form.u_asset_name} onChangeText={v => setForm(f => ({ ...f, u_asset_name: v }))} placeholder="e.g. Elevator T1-A" placeholderTextColor={Colors.textMuted} />
                        <Text style={styles.inputLabel}>Frequency</Text>
                        <FlatList horizontal data={FREQS} keyExtractor={t => t} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.chip, form.u_frequency === item && styles.chipActive]} onPress={() => setForm(f => ({ ...f, u_frequency: item }))}>
                                    <Text style={[styles.chipText, form.u_frequency === item && styles.chipTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <Text style={styles.inputLabel}>Team</Text>
                        <FlatList horizontal data={TEAMS} keyExtractor={t => t} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.chip, form.u_assigned_team === item && styles.chipActive]} onPress={() => setForm(f => ({ ...f, u_assigned_team: item }))}>
                                    <Text style={[styles.chipText, form.u_assigned_team === item && styles.chipTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleAdd} disabled={saving}>
                            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Schedule Task"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAdd(false)}>
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function MetaRow({ label, value }: { label: string; value?: string | null }) {
    return <View style={{ marginBottom: 6 }}>
        <Text style={{ fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase" }}>{label}</Text>
        <Text style={{ fontSize: Fonts.sm, color: Colors.textPrimary, marginTop: 2 }}>{value || "—"}</Text>
    </View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
    title: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    subtitle: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },
    addBtn: { backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: Colors.borderActive },
    addBtnText: { color: Colors.primary, fontWeight: "700", fontSize: Fonts.sm },
    summaryRow: { flexDirection: "row", paddingHorizontal: 20, gap: 6, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: 12, alignItems: "center", borderWidth: 1 },
    summaryCount: { fontSize: Fonts.xl, fontWeight: "800" },
    summaryLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 2, textAlign: "center" },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    empty: { alignItems: "center", paddingTop: 80, gap: 10 },
    emptyIcon: { fontSize: 50, color: Colors.textMuted },
    emptyText: { fontSize: Fonts.md, color: Colors.textMuted },
    taskCard: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: Colors.bgCard, borderRadius: Radius.md,
        padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: Colors.border, gap: 12,
    },
    taskCardOverdue: { borderColor: "rgba(255,59,92,0.3)", backgroundColor: "rgba(255,59,92,0.04)" },
    taskLeft: { alignItems: "center" },
    freqBadge: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,180,255,0.2)" },
    freqText: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.primary },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: Fonts.md, fontWeight: "700", color: Colors.textPrimary },
    taskAsset: { fontSize: Fonts.xs, color: Colors.textSecondary, marginTop: 2 },
    taskMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
    taskTeam: { fontSize: Fonts.xs, color: Colors.textMuted },
    taskDue: { fontSize: Fonts.xs, color: Colors.primary },
    statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: "700" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: Colors.border },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20 },
    modalTitle: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.textPrimary, marginBottom: 16 },
    modalMeta: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, gap: 6, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
    descBox: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
    descLabel: { fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", marginBottom: 6 },
    descText: { fontSize: Fonts.sm, color: Colors.textPrimary, lineHeight: 20 },
    completeBtn: { backgroundColor: "#00D283", borderRadius: Radius.md, padding: 16, alignItems: "center", marginBottom: 10 },
    completeBtnText: { color: Colors.bg, fontSize: Fonts.md, fontWeight: "800" },
    closeBtn: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
    closeBtnText: { color: Colors.textSecondary, fontSize: Fonts.md, fontWeight: "600" },
    inputLabel: { fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
    input: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, color: Colors.textPrimary, fontSize: Fonts.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
    chipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.borderActive },
    chipText: { fontSize: Fonts.sm, color: Colors.textSecondary, fontWeight: "600" },
    chipTextActive: { color: Colors.primary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 16, alignItems: "center", marginBottom: 10 },
    saveBtnText: { color: Colors.bg, fontSize: Fonts.md, fontWeight: "800" },
});
