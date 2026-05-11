/**
 * QRScannerScreen.tsx — Camera-based QR code scanner for field staff.
 *
 * Scans airport location QR codes, extracts terminal/area/code parameters
 * from the embedded URL, and pre-fills the incident report form.
 * Requires expo-barcode-scanner (already in package.json).
 */
import React, { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, SafeAreaView, StatusBar,
    TouchableOpacity, Alert, Vibration, ScrollView,
    TextInput, TextInputProps
} from "react-native";
import { BarCodeScanner, BarCodeScannerResult } from "expo-barcode-scanner";
import { Colors, Fonts, Radius } from "../../theme";
import { createIncident } from "../../services/api";

function TextInputField(props: TextInputProps) {
    return (
        <TextInput
            {...props}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
        />
    );
}

type ScanState = "requesting" | "scanning" | "scanned" | "submitting" | "done" | "denied";

interface ParsedQR {
    terminal: string;
    area: string;
    code: string;
    url: string;
}

function parseQRUrl(data: string): ParsedQR | null {
    try {
        // Handles both http://... and bare query strings
        const urlStr = data.startsWith("http") ? data : `http://dummy.local/${data}`;
        const url = new URL(urlStr);
        const terminal = url.searchParams.get("location") || url.searchParams.get("terminal") || "";
        const area = url.searchParams.get("area") || "";
        const code = url.searchParams.get("code") || "";
        if (!terminal && !area && !code) return null;
        return { terminal, area, code, url: data };
    } catch {
        return null;
    }
}

const PROBLEM_TYPES = [
    { label: "Restroom / Hygiene", icon: "🚻", value: "Restroom" },
    { label: "Electrical / Lighting", icon: "💡", value: "Electrical" },
    { label: "Plumbing / Water", icon: "🚰", value: "Plumbing" },
    { label: "Security / Safety", icon: "🛡", value: "Security" },
    { label: "General / Other", icon: "🔧", value: "General" },
];

export default function QRScannerScreen() {
    const [scanState, setScanState] = useState<ScanState>("requesting");
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [parsedQR, setParsedQR] = useState<ParsedQR | null>(null);
    const [rawData, setRawData] = useState("");
    const [selectedProblem, setSelectedProblem] = useState("General");
    const [description, setDescription] = useState("");
    const [reporterPhone, setReporterPhone] = useState("");
    const [incidentNumber, setIncidentNumber] = useState("");

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === "granted");
            setScanState(status === "granted" ? "scanning" : "denied");
        })();
    }, []);

    const handleBarCodeScanned = ({ type, data }: BarCodeScannerResult) => {
        Vibration.vibrate(100);
        setRawData(data);
        const parsed = parseQRUrl(data);
        setParsedQR(parsed);
        setScanState("scanned");
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert("Missing Info", "Please describe the issue before submitting.");
            return;
        }
        setScanState("submitting");
        try {
            const res = await createIncident({
                short_description: `[${selectedProblem}] ${description.trim()}`,
                location: parsedQR?.terminal || "Unknown Location",
                area: parsedQR?.area || "Unknown Area",
                reported_via: "Mobile_QR_Scan",
                reporter_phone: reporterPhone,
            });
            const incNum = res.data?.incident_number || "INC-PENDING";
            setIncidentNumber(incNum);
            setScanState("done");
        } catch (err) {
            Alert.alert("Submission Failed", "Could not connect to the backend. Please try again.");
            setScanState("scanned");
        }
    };

    const reset = () => {
        setParsedQR(null);
        setRawData("");
        setDescription("");
        setSelectedProblem("General");
        setReporterPhone("");
        setIncidentNumber("");
        setScanState("scanning");
    };

    // ── Permission denied ────────────────────────────────────────────────────
    if (scanState === "denied") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centeredBox}>
                    <Text style={styles.icon}>📷</Text>
                    <Text style={styles.denyTitle}>Camera Permission Required</Text>
                    <Text style={styles.denySub}>
                        Enable camera access in your device settings to scan QR codes.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Scanning ─────────────────────────────────────────────────────────────
    if (scanState === "scanning") {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Scan QR Code</Text>
                    <Text style={styles.headerSub}>Point at an airport location QR code</Text>
                </View>

                <View style={styles.cameraWrapper}>
                    <BarCodeScanner
                        onBarCodeScanned={handleBarCodeScanned}
                        style={styles.camera}
                        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
                    />
                    {/* Overlay frame */}
                    <View style={styles.overlay}>
                        <View style={styles.frameTL} />
                        <View style={styles.frameTR} />
                        <View style={styles.frameBL} />
                        <View style={styles.frameBR} />
                    </View>
                    <Text style={styles.scanHint}>Align QR code within the frame</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Done ────────────────────────────────────────────────────────────────
    if (scanState === "done") {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.successCard}>
                        <View style={styles.successIcon}>
                            <Text style={{ fontSize: 40 }}>✓</Text>
                        </View>
                        <Text style={styles.successTitle}>Incident Reported!</Text>
                        <Text style={styles.successSub}>Your report has been submitted. The team has been notified.</Text>

                        <View style={styles.incBox}>
                            <Text style={styles.incLabel}>INCIDENT NUMBER</Text>
                            <Text style={styles.incNumber}>{incidentNumber}</Text>
                            <Text style={styles.incSave}>Save this to track your issue</Text>
                        </View>

                        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                            <Text style={styles.resetText}>Scan Another QR</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── Scanned — show report form ────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* Location Info */}
                <View style={styles.locationCard}>
                    <Text style={styles.locationLabel}>📍 SCANNED LOCATION</Text>
                    {parsedQR ? (
                        <>
                            <Text style={styles.locationMain}>{parsedQR.terminal}</Text>
                            <Text style={styles.locationSub}>{parsedQR.area} • {parsedQR.code}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.locationMain}>Unknown Location</Text>
                            <Text style={styles.locationSub} numberOfLines={2}>{rawData}</Text>
                        </>
                    )}
                </View>

                {/* Problem Type */}
                <Text style={styles.sectionLabel}>TYPE OF PROBLEM</Text>
                <View style={styles.problemGrid}>
                    {PROBLEM_TYPES.map((p) => (
                        <TouchableOpacity
                            key={p.value}
                            style={[styles.problemCard, selectedProblem === p.value && styles.problemCardActive]}
                            onPress={() => setSelectedProblem(p.value)}
                        >
                            <Text style={styles.problemIcon}>{p.icon}</Text>
                            <Text style={[styles.problemText, selectedProblem === p.value && { color: Colors.primary }]}>
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Actual TextInput */}
                <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>DESCRIPTION *</Text>
                    <TextInputField
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What exactly is the issue? (e.g. Water leaking from ceiling near Gate 5)"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>YOUR WHATSAPP (OPTIONAL)</Text>
                    <TextInputField
                        value={reporterPhone}
                        onChangeText={setReporterPhone}
                        placeholder="+1234567890"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={reset}>
                        <Text style={styles.cancelText}>Rescan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.submitBtn, scanState === "submitting" && { opacity: 0.5 }]}
                        onPress={handleSubmit}
                        disabled={scanState === "submitting"}
                    >
                        <Text style={styles.submitText}>
                            {scanState === "submitting" ? "Submitting..." : "Submit Report"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}


const FRAME_SIZE = 220;
const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: 20, paddingBottom: 60 },
    centeredBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    icon: { fontSize: 60, marginBottom: 16 },
    denyTitle: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.textPrimary, textAlign: "center", marginBottom: 8 },
    denySub: { fontSize: Fonts.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },

    header: { padding: 20, paddingBottom: 8 },
    headerTitle: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    headerSub: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },

    cameraWrapper: { flex: 1, position: "relative", alignItems: "center" },
    camera: { width: "100%", height: 500 },
    overlay: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        marginTop: -FRAME_SIZE / 2,
        marginLeft: -FRAME_SIZE / 2,
    },
    frameTL: { position: "absolute", top: 0, left: 0, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderColor: Colors.primary },
    frameTR: { position: "absolute", top: 0, right: 0, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderRightWidth: BORDER, borderColor: Colors.primary },
    frameBL: { position: "absolute", bottom: 0, left: 0, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderColor: Colors.primary },
    frameBR: { position: "absolute", bottom: 0, right: 0, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: Colors.primary },
    scanHint: { position: "absolute", bottom: 20, color: Colors.textSecondary, fontSize: Fonts.sm },

    locationCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    locationLabel: { fontSize: 9, fontWeight: "800", color: Colors.textMuted, letterSpacing: 1, marginBottom: 6 },
    locationMain: { fontSize: Fonts.xl, fontWeight: "800", color: Colors.textPrimary },
    locationSub: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },

    sectionLabel: { fontSize: 10, fontWeight: "800", color: Colors.primary, letterSpacing: 1, marginBottom: 12, marginTop: 4 },

    problemGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
    problemCard: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: Colors.bgCard, borderRadius: Radius.md,
        paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: Colors.border,
    },
    problemCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
    problemIcon: { fontSize: 16 },
    problemText: { fontSize: Fonts.xs, fontWeight: "700", color: Colors.textSecondary },


    inputBox: { marginBottom: 16 },
    inputLabel: { fontSize: 10, fontWeight: "800", color: Colors.textMuted, letterSpacing: 1, marginBottom: 6 },
    input: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: 14,
        color: Colors.textPrimary,
        fontSize: Fonts.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 48,
        textAlignVertical: "top",
    },

    btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
    cancelBtn: {
        flex: 1, padding: 16, borderRadius: Radius.lg, alignItems: "center",
        backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    },
    cancelText: { color: Colors.textSecondary, fontWeight: "700", fontSize: Fonts.sm },
    submitBtn: {
        flex: 2, padding: 16, borderRadius: Radius.lg, alignItems: "center",
        backgroundColor: Colors.primary,
    },
    submitText: { color: Colors.bg, fontWeight: "800", fontSize: Fonts.sm },

    successCard: { alignItems: "center", paddingTop: 40 },
    successIcon: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: "rgba(0,210,131,0.15)",
        borderWidth: 2, borderColor: "rgba(0,210,131,0.3)",
        alignItems: "center", justifyContent: "center", marginBottom: 16,
    },
    successTitle: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary, marginBottom: 8 },
    successSub: { fontSize: Fonts.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 28, paddingHorizontal: 20 },
    incBox: {
        backgroundColor: "rgba(14,165,233,0.1)", borderRadius: Radius.lg,
        borderWidth: 1, borderColor: "rgba(14,165,233,0.3)",
        padding: 20, alignItems: "center", width: "100%", marginBottom: 24,
    },
    incLabel: { fontSize: 9, fontWeight: "800", color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
    incNumber: { fontSize: 28, fontWeight: "900", color: Colors.primary, letterSpacing: 2 },
    incSave: { fontSize: Fonts.xs, color: Colors.textMuted, marginTop: 6 },
    resetBtn: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 16, alignItems: "center", width: "100%",
        borderWidth: 1, borderColor: Colors.border,
    },
    resetText: { color: Colors.textSecondary, fontWeight: "700", fontSize: Fonts.md },
});
