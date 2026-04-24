import React, { useState, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, SafeAreaView, KeyboardAvoidingView,
    Platform, StatusBar, ActivityIndicator
} from "react-native";
import { chatWithPassenger } from "../../services/api";
import { Colors, Fonts, Radius } from "../../theme";

interface Message { id: string; role: "user" | "ai"; text: string; time: string }

const QUICK_PROMPTS = [
    "Restroom near Gate B is flooded",
    "Elevator at Terminal 2 isn't working",
    "Escalator making loud noise",
    "Air conditioning not working",
];

export default function ChatBotScreen() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "0", role: "ai",
            text: "Hi! I'm AeroBot 🤖\n\nI can help you report any airport facility issue quickly. Tell me what's wrong and where, and I'll handle the rest!",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const flatRef = useRef<FlatList>(null);
    const history = useRef<{ role: string; content: string }[]>([]);

    const send = async (text: string = input.trim()) => {
        if (!text) return;
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const userMsg: Message = { id: Date.now().toString(), role: "user", text, time };
        setMessages(m => [...m, userMsg]);
        history.current.push({ role: "user", content: text });
        setInput("");
        setLoading(true);
        try {
            const res = await chatWithPassenger(text, history.current);
            const aiText = res.data?.reply || "I'm sorry, I couldn't process that. Please try again.";
            history.current.push({ role: "assistant", content: aiText });
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", text: aiText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
            setMessages(m => [...m, aiMsg]);
        } catch {
            setMessages(m => [...m, { id: Date.now().toString(), role: "ai", text: "Connection error. Please check your network and try again.", time }]);
        }
        finally {
            setLoading(false);
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.botAvatar}>
                    <Text style={styles.botAvatarText}>⚡</Text>
                </View>
                <View>
                    <Text style={styles.botName}>AeroBot</Text>
                    <View style={styles.onlineRow}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>AI Assistant · Online</Text>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={90}
            >
                {/* Messages */}
                <FlatList
                    ref={flatRef}
                    data={messages}
                    keyExtractor={m => m.id}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                    ListHeaderComponent={
                        <View style={styles.quickWrap}>
                            <Text style={styles.quickLabel}>Quick Reports</Text>
                            <View style={styles.quickChips}>
                                {QUICK_PROMPTS.map(q => (
                                    <TouchableOpacity key={q} style={styles.quickChip} onPress={() => send(q)}>
                                        <Text style={styles.quickChipText}>{q}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
                            {item.role === "ai" && (
                                <View style={styles.aiDot}><Text style={styles.aiDotText}>⚡</Text></View>
                            )}
                            <View style={[styles.bubbleBody, item.role === "user" ? styles.userBody : styles.aiBody]}>
                                <Text style={[styles.bubbleText, item.role === "user" && styles.userText]}>{item.text}</Text>
                                <Text style={[styles.bubbleTime, item.role === "user" && styles.userTime]}>{item.time}</Text>
                            </View>
                        </View>
                    )}
                    ListFooterComponent={
                        loading ? (
                            <View style={styles.typing}>
                                <View style={styles.aiDot}><Text style={styles.aiDotText}>⚡</Text></View>
                                <View style={styles.typingBody}>
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                    <Text style={styles.typingText}>AeroBot is thinking...</Text>
                                </View>
                            </View>
                        ) : null
                    }
                />

                {/* Input */}
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.textInput}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Describe the issue..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                        onPress={() => send()}
                        disabled={!input.trim() || loading}
                    >
                        <Text style={styles.sendIcon}>→</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
        flexDirection: "row", alignItems: "center", gap: 12,
        padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
        backgroundColor: Colors.bgCard,
    },
    botAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primaryGlow,
        borderWidth: 1.5, borderColor: Colors.borderActive,
        alignItems: "center", justifyContent: "center",
    },
    botAvatarText: { fontSize: 20, color: Colors.primary },
    botName: { fontSize: Fonts.md, fontWeight: "800", color: Colors.textPrimary },
    onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#00D283" },
    onlineText: { fontSize: Fonts.xs, color: Colors.textSecondary },
    messageList: { padding: 16, paddingBottom: 8 },
    quickWrap: { marginBottom: 20 },
    quickLabel: { fontSize: Fonts.xs, color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
    quickChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    quickChip: {
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: Radius.full, backgroundColor: Colors.bgCard,
        borderWidth: 1, borderColor: Colors.border,
    },
    quickChipText: { fontSize: Fonts.xs, color: Colors.textSecondary },
    bubble: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 },
    userBubble: { flexDirection: "row-reverse" },
    aiBubble: {},
    aiDot: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: Colors.primaryGlow,
        borderWidth: 1, borderColor: Colors.borderActive,
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    aiDotText: { fontSize: 14, color: Colors.primary },
    bubbleBody: {
        maxWidth: "75%", borderRadius: Radius.lg, padding: 12,
        paddingHorizontal: 14,
    },
    aiBody: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
    userBody: { backgroundColor: Colors.primary, borderTopRightRadius: 4 },
    bubbleText: { fontSize: Fonts.sm, color: Colors.textPrimary, lineHeight: 20 },
    userText: { color: Colors.bg },
    bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: "right" },
    userTime: { color: "rgba(0,0,0,0.4)" },
    typing: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    typingBody: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 12,
        borderWidth: 1, borderColor: Colors.border,
    },
    typingText: { fontSize: Fonts.xs, color: Colors.textMuted },
    inputArea: {
        flexDirection: "row", alignItems: "flex-end", gap: 10,
        padding: 12, paddingHorizontal: 16,
        borderTopWidth: 1, borderTopColor: Colors.border,
        backgroundColor: Colors.bgCard,
    },
    textInput: {
        flex: 1, backgroundColor: Colors.bgElevated,
        borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10,
        color: Colors.textPrimary, fontSize: Fonts.sm,
        maxHeight: 100, borderWidth: 1, borderColor: Colors.border,
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.3 },
    sendIcon: { color: Colors.bg, fontSize: 18, fontWeight: "800" },
});