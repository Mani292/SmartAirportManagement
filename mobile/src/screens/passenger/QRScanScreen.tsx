import React from "react";
import {
    View, Text, StyleSheet, SafeAreaView,
    TouchableOpacity, Alert, StatusBar
} from "react-native";
import { Colors, Fonts, Radius } from "../../theme";

export default function QRScanScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>QR Scanner</Text>
                <Text style={styles.headerSub}>Scan a location QR code</Text>
            </View>

            <View style={styles.body}>
                {/* Scanner Frame */}
                <View style={styles.scanFrameWrap}>
                    <View style={styles.scanFrame}>
                        <View style={styles.scanCornerTL} />
                        <View style={styles.scanCornerTR} />
                        <View style={styles.scanCornerBL} />
                        <View style={styles.scanCornerBR} />
                        
                        <View style={styles.scanIconBox}>
                            <Text style={styles.scanIcon}>◈</Text>
                        </View>
                        <Text style={styles.scanTitle}>Camera Scanner</Text>
                        <Text style={styles.scanDesc}>
                            Point your camera at a QR code placed near any airport facility to instantly report issues.
                        </Text>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>HOW IT WORKS</Text>
                    
                    <View style={styles.step}>
                        <View style={styles.stepNumBox}><Text style={styles.stepNum}>1</Text></View>
                        <Text style={styles.stepText}>Find a QR code sticker</Text>
                    </View>
                    <View style={styles.stepLine} />
                    
                    <View style={styles.step}>
                        <View style={styles.stepNumBox}><Text style={styles.stepNum}>2</Text></View>
                        <Text style={styles.stepText}>Tap the Scan button below</Text>
                    </View>
                    <View style={styles.stepLine} />
                    
                    <View style={styles.step}>
                        <View style={styles.stepNumBox}><Text style={styles.stepNum}>3</Text></View>
                        <Text style={styles.stepText}>Location is auto-filled for your report</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={() => Alert.alert(
                        "Camera Permission Required",
                        "To use QR scanning, please allow camera access in your device settings.",
                        [{ text: "OK" }]
                    )}
                    activeOpacity={0.8}
                >
                    <Text style={styles.scanBtnText}>Open Camera</Text>
                </TouchableOpacity>

                <Text style={styles.note}>
                    Note: expo-camera must be granted permission in order to scan.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: Fonts.xxl, fontWeight: "800", color: Colors.textPrimary },
    headerSub: { fontSize: Fonts.sm, color: Colors.textSecondary, marginTop: 2 },
    body: { flex: 1, padding: 20 },
    
    scanFrameWrap: {
        backgroundColor: "rgba(0,180,255,0.05)",
        borderRadius: Radius.xl,
        padding: 24,
        marginBottom: 24,
        alignItems: "center",
    },
    scanFrame: {
        width: "100%", padding: 30, alignItems: "center",
        borderWidth: 1.5, borderColor: "rgba(0,180,255,0.3)",
        borderStyle: "dashed", borderRadius: Radius.lg,
        position: "relative",
    },
    scanCornerTL: { position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderTopLeftRadius: Radius.md },
    scanCornerTR: { position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTopWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderTopRightRadius: Radius.md },
    scanCornerBL: { position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderBottomLeftRadius: Radius.md },
    scanCornerBR: { position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderBottomRightRadius: Radius.md },
    
    scanIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryGlow, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: Colors.borderActive },
    scanIcon: { fontSize: 32, color: Colors.primary },
    scanTitle: { fontSize: Fonts.lg, fontWeight: "800", color: Colors.textPrimary, marginBottom: 8 },
    scanDesc: { fontSize: Fonts.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
    
    infoCard: {
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
        padding: 24, marginBottom: 24,
        borderWidth: 1, borderColor: Colors.border,
    },
    infoTitle: { fontSize: Fonts.xs, fontWeight: "800", color: Colors.textMuted, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
    step: { flexDirection: "row", alignItems: "center", gap: 12 },
    stepNumBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bgElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
    stepNum: { color: Colors.textPrimary, fontWeight: "800", fontSize: Fonts.xs },
    stepText: { flex: 1, fontSize: Fonts.sm, color: Colors.textPrimary, fontWeight: "500" },
    stepLine: { width: 2, height: 16, backgroundColor: Colors.border, marginLeft: 13, marginVertical: 4 },
    
    scanBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: Radius.lg, alignItems: "center", marginBottom: 16 },
    scanBtnText: { color: Colors.bg, fontWeight: "800", fontSize: Fonts.lg },
    note: { fontSize: 10, color: Colors.textMuted, textAlign: "center" },
});
