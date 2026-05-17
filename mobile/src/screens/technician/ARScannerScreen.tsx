"""
ARScannerScreen.tsx — Augmented Reality Asset Scanner for field technicians.

Workflow:
  1. Technician opens the AR Scanner from their task list.
  2. Camera activates and scans a QR code affixed to the physical asset.
  3. QR value (asset sys_id) is sent to GET /api/v1/assets/{sys_id}
     and GET /api/v1/iot/predict/{asset_id} for live health + prediction.
  4. An AR overlay displays real-time health, MTTR, and AI repair guidance.
  5. Technician can create an incident directly from the scanner if needed.
*/
import React, { useState, useEffect, useRef } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, ActivityIndicator, ScrollView, Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors, Fonts, Radius } from "../../theme";
import api from "../../services/api";

interface AssetDetail {
    sys_id: string;
    u_name: string;
    u_type: string;
    u_status: string;
    u_criticality: string;
    u_last_serviced: string;
    u_terminal: string;
}

interface PredictionResult {
    risk: string;
    days_until_failure: number;
    confidence: number;
    recommendation: string;
    analysis_metrics?: {
        avg_vibration: number;
        vibration_trend: number;
        sample_size: number;
    };
}

type ScanPhase = "awaiting_scan" | "fetching" | "ready" | "error";

export default function ARScannerScreen() {
    const navigation = useNavigation<any>();
    const [phase, setPhase] = useState<ScanPhase>("awaiting_scan");
    const [asset, setAsset] = useState<AssetDetail | null>(null);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const scanAttemptRef = useRef(false);

    // In a production build with expo-camera + expo-barcode-scanner,
    // this would be replaced by a real QR scan callback.
    // For demo / review: scan the default seeded asset after 2 seconds.
    const simulateScan = async () => {
        if (scanAttemptRef.current) return;
        scanAttemptRef.current = true;
        setPhase("fetching");

        try {
            // Fetch the first seeded asset as the "scanned" asset
            const assetsRes = await axiosApi.get("/assets/");
            const assetList: AssetDetail[] = assetsRes.data?.result || [];

            if (!assetList.length) {
                throw new Error("No assets found in the CMDB.");
            }

            const scannedAsset = assetList[0];
            setAsset(scannedAsset);

            // Fetch real predictive maintenance data
            try {
                const predRes = await axiosApi.get(`/iot/predict/${scannedAsset.sys_id}`);
                setPrediction(predRes.data);
            } catch {
                // Prediction unavailable — show asset data only
                setPrediction(null);
            }

            setPhase("ready");
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.detail || err.message || "Failed to fetch asset data.");
            setPhase("error");
        }
    };

    useEffect(() => {
        const timer = setTimeout(simulateScan, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleCreateIncident = () => {
        if (!asset) return;
        navigation.navigate("ReportIssue", {
            prefillLocation: asset.u_terminal,
            prefillArea: asset.u_name,
        });
    };

    const riskColor = (risk: string) => {
        if (risk === "HIGH") return "#FF3B5C";
        if (risk === "MEDIUM") return "#FF8C00";
        return "#00D283";
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Camera Frame Background */}
            <View style={styles.cameraView}>
                {/* Grid overlay */}
                <View style={styles.gridRow}>
                    <View style={styles.corner} />
                    <View style={[styles.corner, { transform: [{ rotate: "90deg" }] }]} />
                </View>
                <View style={[styles.gridRow, { marginTop: "auto" }]}>
                    <View style={[styles.corner, { transform: [{ rotate: "-90deg" }] }]} />
                    <View style={[styles.corner, { transform: [{ rotate: "180deg" }] }]} />
                </View>

                {/* Phase: Awaiting */}
                {phase === "awaiting_scan" && (
                    <View style={styles.centerOverlay}>
                        <View style={styles.scanBox} />
                        <Text style={styles.scanHint}>Point camera at asset QR code</Text>
                    </View>
                )}

                {/* Phase: Fetching */}
                {phase === "fetching" && (
                    <View style={styles.centerOverlay}>
                        <ActivityIndicator size="large" color="#64FFDA" />
                        <Text style={styles.scanHint}>Fetching asset from CMDB...</Text>
                    </View>
                )}

                {/* Phase: Error */}
                {phase === "error" && (
                    <View style={styles.centerOverlay}>
                        <Text style={{ color: "#FF3B5C", fontSize: 28 }}>✕</Text>
                        <Text style={[styles.scanHint, { color: "#FF3B5C" }]}>{errorMsg}</Text>
                    </View>
                )}

                {/* Phase: Ready — AR Overlay */}
                {phase === "ready" && asset && (
                    <ScrollView
                        style={styles.arOverlayScroll}
                        contentContainerStyle={styles.arOverlayContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.arCard}>
                            <Text style={styles.arHeader}>ASSET IDENTIFIED</Text>
                            <Text style={styles.arTitle}>{asset.u_name}</Text>
                            <Text style={styles.arSub}>{asset.u_type} · {asset.u_terminal}</Text>

                            <View style={styles.divider} />

                            <View style={styles.arRow}>
                                <Text style={styles.arLabel}>Status</Text>
                                <Text style={[styles.arValue, { color: asset.u_status === "operational" ? "#00D283" : "#FF8C00" }]}>
                                    {(asset.u_status || "Unknown").toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.arRow}>
                                <Text style={styles.arLabel}>Criticality</Text>
                                <Text style={styles.arValue}>{asset.u_criticality || "Medium"}</Text>
                            </View>
                            <View style={styles.arRow}>
                                <Text style={styles.arLabel}>Last Serviced</Text>
                                <Text style={styles.arValue}>{asset.u_last_serviced || "Unknown"}</Text>
                            </View>

                            {prediction && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionLabel}>🔮 PREDICTIVE ANALYSIS</Text>

                                    <View style={styles.arRow}>
                                        <Text style={styles.arLabel}>Failure Risk</Text>
                                        <Text style={[styles.arValue, { color: riskColor(prediction.risk), fontWeight: "900" }]}>
                                            {prediction.risk}
                                        </Text>
                                    </View>
                                    <View style={styles.arRow}>
                                        <Text style={styles.arLabel}>Est. Days to Failure</Text>
                                        <Text style={[styles.arValue, { color: riskColor(prediction.risk) }]}>
                                            {prediction.days_until_failure}d
                                        </Text>
                                    </View>
                                    <View style={styles.arRow}>
                                        <Text style={styles.arLabel}>Model Confidence</Text>
                                        <Text style={styles.arValue}>{Math.round(prediction.confidence * 100)}%</Text>
                                    </View>

                                    <View style={styles.aiBox}>
                                        <Text style={styles.aiLabel}>🤖 AI RECOMMENDATION</Text>
                                        <Text style={styles.aiText}>{prediction.recommendation}</Text>
                                    </View>

                                    {prediction.analysis_metrics && (
                                        <View style={styles.metricsRow}>
                                            <View style={styles.metricBox}>
                                                <Text style={styles.metricVal}>{prediction.analysis_metrics.avg_vibration}</Text>
                                                <Text style={styles.metricKey}>Avg Vib.</Text>
                                            </View>
                                            <View style={styles.metricBox}>
                                                <Text style={styles.metricVal}>{prediction.analysis_metrics.vibration_trend}</Text>
                                                <Text style={styles.metricKey}>Trend</Text>
                                            </View>
                                            <View style={styles.metricBox}>
                                                <Text style={styles.metricVal}>{prediction.analysis_metrics.sample_size}</Text>
                                                <Text style={styles.metricKey}>Readings</Text>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}

                            {!prediction && (
                                <Text style={styles.noPrediction}>
                                    No telemetry data yet — send IoT readings to enable prediction.
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* Bottom Controls */}
            <View style={styles.controls}>
                {phase === "ready" && (
                    <TouchableOpacity style={styles.incidentButton} onPress={handleCreateIncident}>
                        <Text style={styles.incidentButtonText}>⚡ Create Incident for this Asset</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeText}>Close AR View</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#060D1A" },
    cameraView: {
        flex: 1, justifyContent: "center", alignItems: "center",
        position: "relative",
        paddingHorizontal: 16, paddingVertical: 20,
    },
    gridRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", position: "absolute", top: 20, paddingHorizontal: 16 },
    corner: { width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#64FFDA" },
    centerOverlay: { alignItems: "center", gap: 16 },
    scanBox: { width: 200, height: 200, borderWidth: 2, borderColor: "rgba(100,255,218,0.5)", borderStyle: "dashed", borderRadius: 12 },
    scanHint: { color: "#64FFDA", fontFamily: "monospace", fontSize: 13, textAlign: "center", letterSpacing: 0.5 },
    arOverlayScroll: { width: "100%", flex: 1 },
    arOverlayContent: { paddingTop: 50 },
    arCard: {
        backgroundColor: "rgba(6, 13, 26, 0.88)",
        borderColor: "#64FFDA", borderWidth: 1,
        borderRadius: Radius.lg, padding: 18, marginHorizontal: 8,
    },
    arHeader: { color: "#64FFDA", fontSize: 9, fontFamily: "monospace", letterSpacing: 3, marginBottom: 4 },
    arTitle: { color: "#CCD6F6", fontSize: Fonts.xl, fontWeight: "900", letterSpacing: -0.5 },
    arSub: { color: "#8892B0", fontSize: Fonts.sm, marginBottom: 8 },
    divider: { height: 1, backgroundColor: "rgba(100,255,218,0.15)", marginVertical: 10 },
    sectionLabel: { color: "#64FFDA", fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
    arRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
    arLabel: { color: "#8892B0", fontSize: Fonts.sm },
    arValue: { color: "#CCD6F6", fontSize: Fonts.sm, fontWeight: "700" },
    aiBox: { backgroundColor: "rgba(100,255,218,0.08)", padding: 12, borderRadius: 8, marginTop: 8 },
    aiLabel: { color: "#64FFDA", fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 5 },
    aiText: { color: "#CCD6F6", fontSize: Fonts.xs, lineHeight: 18 },
    metricsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
    metricBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 8, alignItems: "center" },
    metricVal: { color: "#CCD6F6", fontSize: Fonts.md, fontWeight: "800", fontFamily: "monospace" },
    metricKey: { color: "#8892B0", fontSize: 9, marginTop: 3 },
    noPrediction: { color: "#8892B0", fontSize: Fonts.xs, fontStyle: "italic", textAlign: "center", marginTop: 8 },
    controls: { padding: 16, paddingBottom: 30, backgroundColor: "#060D1A", gap: 10 },
    incidentButton: {
        backgroundColor: "rgba(255, 139, 0, 0.15)",
        borderColor: "#FF8C00", borderWidth: 1,
        padding: 14, borderRadius: Radius.full, alignItems: "center",
    },
    incidentButtonText: { color: "#FF8C00", fontWeight: "800", fontSize: Fonts.sm },
    closeButton: {
        backgroundColor: "rgba(255,59,92,0.1)",
        borderColor: "#FF3B5C", borderWidth: 1,
        padding: 14, borderRadius: Radius.full, alignItems: "center",
    },
    closeText: { color: "#FF3B5C", fontWeight: "700", fontSize: Fonts.sm },
});
