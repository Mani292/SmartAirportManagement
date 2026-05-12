import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors, Fonts, Radius } from "../../theme";

export default function ARScannerScreen() {
    const navigation = useNavigation();
    const [scanning, setScanning] = useState(true);
    const [scannedAsset, setScannedAsset] = useState<any>(null);

    useEffect(() => {
        // Simulate a camera scan after 3 seconds finding an asset
        const timer = setTimeout(() => {
            setScanning(false);
            setScannedAsset({
                id: "BAGGAGE-04",
                health: "88%",
                mttr: "1.2 hrs",
                ai_guidance: "Tighten main drive belt. Inspect roller bearings for wear.",
                last_serviced: "14 days ago"
            });
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Fake Camera View Background */}
            <View style={styles.cameraView}>
                <View style={styles.crosshair} />
                
                {scanning ? (
                    <View style={styles.scanningOverlay}>
                        <ActivityIndicator size="large" color="#64FFDA" />
                        <Text style={styles.scanningText}>Analyzing Asset...</Text>
                    </View>
                ) : (
                    <View style={styles.arOverlay}>
                        <View style={styles.arCard}>
                            <Text style={styles.arTitle}>Asset: {scannedAsset.id}</Text>
                            <View style={styles.arRow}>
                                <Text style={styles.arLabel}>Health</Text>
                                <Text style={styles.arValueGood}>{scannedAsset.health}</Text>
                            </View>
                            <View style={styles.arRow}>
                                <Text style={styles.arLabel}>MTTR</Text>
                                <Text style={styles.arValue}>{scannedAsset.mttr}</Text>
                            </View>
                            <View style={styles.arRow}>
                                <Text style={styles.arLabel}>Last Serviced</Text>
                                <Text style={styles.arValue}>{scannedAsset.last_serviced}</Text>
                            </View>
                            <View style={styles.aiBox}>
                                <Text style={styles.aiLabel}>🤖 AI GUIDANCE</Text>
                                <Text style={styles.aiText}>{scannedAsset.ai_guidance}</Text>
                            </View>
                        </View>
                        
                        {/* Target Box around the "physical" object */}
                        <View style={styles.targetBox} />
                    </View>
                )}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeText}>Close AR View</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    cameraView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" },
    crosshair: {
        position: "absolute", width: 250, height: 250,
        borderWidth: 2, borderColor: "rgba(100, 255, 218, 0.3)",
        borderRadius: 20
    },
    scanningOverlay: { alignItems: "center", gap: 10 },
    scanningText: { color: "#64FFDA", fontFamily: "monospace", fontSize: 16, letterSpacing: 2 },
    arOverlay: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", padding: 20 },
    targetBox: {
        position: "absolute", width: 260, height: 260,
        borderWidth: 2, borderColor: "#64FFDA",
        borderStyle: "dashed", borderRadius: 20
    },
    arCard: {
        position: "absolute", top: 100, left: 20, right: 20,
        backgroundColor: "rgba(10, 25, 47, 0.85)",
        borderColor: "#64FFDA", borderWidth: 1,
        borderRadius: Radius.lg, padding: 16, zIndex: 10
    },
    arTitle: { color: "#64FFDA", fontSize: Fonts.xl, fontWeight: "900", marginBottom: 12, fontFamily: "monospace" },
    arRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    arLabel: { color: "#8892B0", fontSize: Fonts.sm, fontFamily: "monospace" },
    arValue: { color: "#CCD6F6", fontSize: Fonts.sm, fontFamily: "monospace", fontWeight: "bold" },
    arValueGood: { color: "#00D283", fontSize: Fonts.sm, fontFamily: "monospace", fontWeight: "bold" },
    aiBox: { marginTop: 12, backgroundColor: "rgba(100, 255, 218, 0.1)", padding: 10, borderRadius: 8 },
    aiLabel: { color: "#64FFDA", fontSize: 10, fontWeight: "bold", marginBottom: 4 },
    aiText: { color: "#CCD6F6", fontSize: Fonts.xs, lineHeight: 18 },
    controls: { padding: 20, paddingBottom: 40, backgroundColor: "#000" },
    closeButton: {
        backgroundColor: "rgba(255,59,92,0.2)",
        borderColor: "#FF3B5C", borderWidth: 1,
        padding: 16, borderRadius: Radius.full,
        alignItems: "center"
    },
    closeText: { color: "#FF3B5C", fontWeight: "bold", fontSize: Fonts.md }
});
