import React, { useState, useCallback, useEffect } from "react";
import {
    View, Text, FlatList, StyleSheet, SafeAreaView,
    TouchableOpacity, Modal, TextInput, Alert, StatusBar, RefreshControl
} from "react-native";
import { getAssets, createAsset } from "../../services/api";
import { Colors, Fonts, Radius } from "../../theme";

interface Asset {
    sys_id: string;
    u_name: string;
    u_type: string;
    u_location: string;
    u_status: "operational" | "maintenance" | "faulty" | "retired";
    u_last_serviced: string;
    u_terminal: string;
}

const STATUS_CONFIG = {
    operational: { color: "#00D283", bg: "rgba(0,210,131,0.12)", label: "Operational" },
    maintenance: { color: "#FF8C00", bg: "rgba(255,140,0,0.12)", label: "In Maintenance" },
    faulty: { color: "#FF3B5C", bg: "rgba(255,59,92,0.12)", label: "Faulty" },
    retired: { color: "#8896A9", bg: "rgba(136,150,169,0.12)", label: "Retired" },
};

const TYPES = [
    "Baggage Conveyor",
    "Runway Lighting",
    "Jet Bridge",
    "Fuel Pump",
    "Security Scanner",
    "HVAC",
    "Elevator",
    "Escalator",
    "Generator",
    "Fire System",
    "CCTV",
    "Gate",
    "Other"
];
const TERMINALS = ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"];

export default function AssetManagementScreen() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ u_name: "", u_type: TYPES[0], u_location: "", u_terminal: TERMINALS[0] });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await getAssets();
            setAssets(res.data?.result || []);
        } catch { Alert.alert("Error", "Could not load assets."); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const statusCounts = {
        operational: assets.filter(a => a.u_status === "operational").length,
        maintenance: assets.filter(a => a.u_status === "maintenance").length,
        faulty: assets.filter(a => a.u_status === "faulty").length,
    };

    const handleAdd = async () => {
        if (!form.u_name || !form.u_location) {
            Alert.alert("Missing", "Please fill Asset Name and Location.");
            return;
        }
        setSaving(true);
        try {
            await createAsset({ ...form, u_status: "operational" });
            Alert.alert("Added!", "Asset registered successfully.");
            setShowAdd(false);
            setForm({ u_name: "", u_type: TYPES[0], u_location: "", u_terminal: TERMINALS[0] });
            setRefreshing(true);
            load();
        } catch { Alert.alert("Error", "Could not add asset."); }
        finally { setSaving(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Asset Management</Text>
                    <Text style={styles.subtitle}>{assets.length} registered assets</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {/* Status Summary */}
            <View style={styles.summaryRow}>
                {Object.entries(statusCounts).map(([key, count]) => {
                    const cfg = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG];
                    return (
                        <View key={key} style={[styles.summaryCard, { borderColor: cfg.color + "30" }]}>
                            <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
                            <Text style={styles.summaryLabel}>{cfg.label}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Assets List */}
            <FlatList
                data={assets}
                keyExtractor={i => i.sys_id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>◈</Text>
                        <Text style={styles.emptyText}>{loading ? "Loading assets..." : "No assets registered"}</Text>
                        {!loading && <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.emptyBtn}>
                            <Text style={styles.emptyBtnText}>Register First Asset</Text>
                        </TouchableOpacity>}
                    </View>
                }
                renderItem={({ item }) => {
                    const cfg = STATUS_CONFIG[item.u_status] || STATUS_CONFIG.operational;
                    return (
                        <View style={styles.assetCard}>
                            <View style={[styles.assetTypeBadge, { backgroundColor: "rgba(0,180,255,0.12)" }]}>
                                <Text style={styles.assetTypeText}>{item.u_type?.[0] || "A"}</Text>
                            </View>
                            <View style={styles.assetInfo}>
                                <Text style={styles.assetName}>{item.u_name}</Text>
                                <Text style={styles.assetMeta}>{item.u_type} · {item.u_terminal}</Text>
                                <Text style={styles.assetLocation}>{item.u_location}</Text>
                            </View>
                            <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color + "40" }]}>
                                <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                                <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        </View>
                    );
                }}
            />

            {/* Add Modal */}
            <Modal visible={showAdd} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Register Asset</Text>

                        <FormLabel label="Asset Name" />
                        <TextInput
                            style={styles.input}
                            value={form.u_name}
                            onChangeText={v => setForm(f => ({ ...f, u_name: v }))}
                            placeholder="e.g. Elevator T1-A"
                            placeholderTextColor={Colors.textMuted}
                        />

                        <FormLabel label="Type" />
                        <FlatList
                            horizontal data={TYPES}
                            keyExtractor={t => t}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, marginBottom: 14 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.typeChip, form.u_type === item && styles.typeChipActive]}
                                    onPress={() => setForm(f => ({ ...f, u_type: item }))}
                                >
                                    <Text style={[styles.typeText, form.u_type === item && styles.typeTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />

                        <FormLabel label="Terminal" />
                        <FlatList
                            horizontal data={TERMINALS}
                            keyExtractor={t => t}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, marginBottom: 14 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.typeChip, form.u_terminal === item && styles.typeChipActive]}
                                    onPress={() => setForm(f => ({ ...f, u_terminal: item }))}
                                >
                                    <Text style={[styles.typeText, form.u_terminal === item && styles.typeTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />

                        <FormLabel label="Location" />
                        <TextInput
                            style={styles.input}
                            value={form.u_location}
                            onChangeText={v => setForm(f => ({ ...f, u_location: v }))}
                            placeholder="e.g. Near Gate B3"
                            placeholderTextColor={Colors.textMuted}
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                            onPress={handleAdd}
                            disabled={saving}
                        >
                            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Register Asset"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function FormLabel({ label }: { label: string }) {
    return <Text style={{ fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 }}>{label}</Text>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", padding: 20,
    },
    title: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    subtitle: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },
    addBtn: {
        backgroundColor: Colors.primaryGlow,
        borderRadius: Radius.md,
        paddingHorizontal: 16, paddingVertical: 10,
        borderWidth: 1, borderColor: Colors.borderActive,
    },
    addBtnText: { color: Colors.primary, fontWeight: "700", fontSize: Fonts.sm },
    summaryRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    summaryCard: {
        flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.md,
        padding: 14, alignItems: "center",
        borderWidth: 1,
    },
    summaryCount: { fontSize: Fonts.xl, fontWeight: "800" },
    summaryLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: "center" },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    empty: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyIcon: { fontSize: 50, color: Colors.textMuted },
    emptyText: { fontSize: Fonts.md, color: Colors.textMuted },
    emptyBtn: {
        backgroundColor: Colors.primaryGlow, borderRadius: Radius.md,
        paddingHorizontal: 20, paddingVertical: 12,
        borderWidth: 1, borderColor: Colors.borderActive,
    },
    emptyBtnText: { color: Colors.primary, fontWeight: "700" },
    assetCard: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: Colors.bgCard, borderRadius: Radius.md,
        padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: Colors.border, gap: 12,
    },
    assetTypeBadge: {
        width: 44, height: 44, borderRadius: 13,
        alignItems: "center", justifyContent: "center",
        borderWidth: 1, borderColor: "rgba(0,180,255,0.2)",
    },
    assetTypeText: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.primary },
    assetInfo: { flex: 1 },
    assetName: { fontSize: Fonts.md, fontWeight: "700", color: Colors.textPrimary },
    assetMeta: { fontSize: Fonts.xs, color: Colors.textSecondary, marginTop: 2 },
    assetLocation: { fontSize: Fonts.xs, color: Colors.textMuted, marginTop: 1 },
    statusPill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: Radius.full, borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: "700" },
    // Modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    modal: {
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
        borderTopWidth: 1, borderTopColor: Colors.border,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: Colors.border, alignSelf: "center", marginBottom: 20,
    },
    modalTitle: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.textPrimary, marginBottom: 16 },
    input: {
        backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
        padding: 14, color: Colors.textPrimary, fontSize: Fonts.md,
        borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
    },
    typeChip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: Radius.full, backgroundColor: Colors.bgElevated,
        borderWidth: 1, borderColor: Colors.border,
    },
    typeChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.borderActive },
    typeText: { fontSize: Fonts.sm, color: Colors.textSecondary, fontWeight: "600" },
    typeTextActive: { color: Colors.primary },
    saveBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.md,
        padding: 16, alignItems: "center", marginBottom: 10,
    },
    saveBtnText: { color: Colors.bg, fontSize: Fonts.md, fontWeight: "800" },
    cancelBtn: {
        backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
        padding: 14, alignItems: "center",
        borderWidth: 1, borderColor: Colors.border,
    },
    cancelBtnText: { color: Colors.textSecondary, fontSize: Fonts.md, fontWeight: "600" },
});
