import React, { useState } from "react";
import {
    View, Text, StyleSheet, SafeAreaView,
    TouchableOpacity, TextInput, ScrollView,
    Alert, StatusBar, KeyboardAvoidingView, Platform
} from "react-native";
import { generateQR } from "../../services/api";
import { Colors, Fonts, Radius } from "../../theme";

const TERMINALS = ["Terminal 1", "Terminal 2", "Terminal 3", "Terminal 4"];
const AREAS = ["Restroom", "Elevator", "Escalator", "Gate", "Baggage Claim", "Lounge", "Parking", "Security", "Offices"];

export default function QRGeneratorScreen() {
    const [terminal, setTerminal] = useState("Terminal 1");
    const [area, setArea] = useState("Restroom");
    const [locationCode, setLocationCode] = useState("");
    const [generating, setGenerating] = useState(false);
    const [qrGenerated, setQrGenerated] = useState(false);
    const [qrInfo, setQrInfo] = useState({ terminal: "", area: "", code: "" });

    const handleGenerate = async () => {
        if (!locationCode.trim()) { Alert.alert("Missing", "Please enter a location code (e.g. T1-R-A)."); return; }
        setGenerating(true);
        try {
            await generateQR({ terminal, area, location_code: locationCode });
            setQrInfo({ terminal, area, code: locationCode });
            setQrGenerated(true);
        } catch { Alert.alert("Error", "Could not generate QR. Check backend connection."); }
        finally { setGenerating(false); }
    };

    const reset = () => {
        setQrGenerated(false);
        setLocationCode("");
        setQrInfo({ terminal: "", area: "", code: "" });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>QR Generator</Text>
                        <Text style={styles.headerSub}>Create location codes</Text>
                    </View>

                    {!qrGenerated ? (
                        <View style={styles.form}>
                            {/* Terminal */}
                            <Text style={styles.label}>Select Terminal</Text>
                            <View style={styles.chipsWrap}>
                                {TERMINALS.map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.chip, terminal === t && styles.chipSelected]}
                                        onPress={() => setTerminal(t)}
                                    >
                                        <Text style={[styles.chipText, terminal === t && styles.chipTextSelected]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Area */}
                            <Text style={styles.label}>Select Area</Text>
                            <View style={styles.chipsWrap}>
                                {AREAS.map((a) => (
                                    <TouchableOpacity
                                        key={a}
                                        style={[styles.chip, area === a && styles.chipSelected]}
                                        onPress={() => setArea(a)}
                                    >
                                        <Text style={[styles.chipText, area === a && styles.chipTextSelected]}>{a}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Location Code */}
                            <Text style={styles.label}>Location Code *</Text>
                            <TextInput
                                style={styles.input}
                                value={locationCode}
                                onChangeText={setLocationCode}
                                placeholder="e.g. T1-REST-A, T2-ELEV-1"
                                placeholderTextColor={Colors.textMuted}
                                autoCapitalize="characters"
                            />
                            <Text style={styles.hint}>Format: [Terminal]-[Area]-[Number] e.g. T1-REST-A</Text>

                            {/* Preview box */}
                            <View style={styles.previewBox}>
                                <Text style={styles.previewLabel}>PREVIEW DATA</Text>
                                <PreviewRow label="Terminal" value={terminal} />
                                <PreviewRow label="Area" value={area} />
                                <PreviewRow label="Code" value={locationCode || "—"} />
                                <Text style={styles.previewDeepLink} numberOfLines={2}>
                                    http://localhost:5173/?location={terminal}&area={area}&code={locationCode}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.generateBtn, generating && { opacity: 0.5 }]}
                                onPress={handleGenerate}
                                disabled={generating}
                            >
                                <Text style={styles.generateBtnText}>{generating ? "Generating..." : "Generate QR Code"}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.successCard}>
                            <View style={styles.successIconBox}>
                                <Text style={styles.successIcon}>✓</Text>
                            </View>
                            <Text style={styles.successTitle}>Generated!</Text>
                            
                            <View style={styles.qrVisual}>
                                <Text style={styles.qrVisualIcon}>▣</Text>
                            </View>

                            <View style={styles.qrDataBox}>
                                <Text style={styles.qrDataHeader}>QR DATA STORED</Text>
                                <Text style={styles.qrDataVal}>{qrInfo.terminal} • {qrInfo.area}</Text>
                                <Text style={styles.qrDataCode}>{qrInfo.code}</Text>
                                <Text style={styles.qrDataLink}>http://localhost:5173/?location={qrInfo.terminal}&area={qrInfo.area}&code={qrInfo.code}</Text>
                            </View>

                            <Text style={styles.apiLabel}>QR image available via Backend API</Text>

                            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                                <Text style={styles.resetBtnText}>Generate Another</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: Fonts.sm, color: Colors.textSecondary }}>{label}</Text>
            <Text style={{ fontSize: Fonts.sm, color: Colors.textPrimary, fontWeight: "600" }}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: 20, paddingBottom: 60 },
    header: { marginBottom: 24 },
    headerTitle: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    headerSub: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },
    form: {},
    label: { fontSize: Fonts.xs, fontWeight: "700", color: Colors.textSecondary, marginBottom: 10, marginTop: 20, textTransform: "uppercase", letterSpacing: 0.5 },
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
    chipSelected: { backgroundColor: Colors.primaryGlow, borderColor: Colors.borderActive },
    chipText: { fontSize: Fonts.sm, color: Colors.textSecondary, fontWeight: "600" },
    chipTextSelected: { color: Colors.primary },
    input: { backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: 14, color: Colors.textPrimary, fontSize: Fonts.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
    hint: { fontSize: Fonts.xs, color: Colors.textMuted },
    previewBox: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 14, marginTop: 24, borderWidth: 1, borderColor: Colors.border },
    previewLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
    previewDeepLink: { fontSize: 10, color: Colors.primary, marginTop: 8, opacity: 0.8 },
    generateBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 18, alignItems: "center", marginTop: 24 },
    generateBtnText: { color: Colors.bg, fontSize: Fonts.md, fontWeight: "800" },
    
    successCard: { alignItems: "center", paddingTop: 20 },
    successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0,210,131,0.15)", borderWidth: 2, borderColor: "rgba(0,210,131,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    successIcon: { fontSize: 40, color: "#00D283", fontWeight: "800" },
    successTitle: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary, marginBottom: 24 },
    qrVisual: { width: 180, height: 180, backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderActive, alignItems: "center", justifyContent: "center", marginBottom: 24, ...Colors.primaryGlow && { shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 20 } },
    qrVisualIcon: { fontSize: 80, color: Colors.primary },
    qrDataBox: { backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: 16, width: "100%", borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
    qrDataHeader: { fontSize: 9, color: Colors.textMuted, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
    qrDataVal: { fontSize: Fonts.sm, color: Colors.textSecondary, marginBottom: 4 },
    qrDataCode: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.primary, marginBottom: 8 },
    qrDataLink: { fontSize: 10, color: Colors.textMuted },
    apiLabel: { fontSize: Fonts.xs, color: Colors.primary, marginBottom: 24 },
    resetBtn: { backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, padding: 16, alignItems: "center", width: "100%", borderWidth: 1, borderColor: Colors.border },
    resetBtnText: { color: Colors.textSecondary, fontSize: Fonts.md, fontWeight: "700" },
});
