import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatBubble } from '@components/chat/ChatBubble';
import { QuotaBadge } from '@components/chat/QuotaBadge';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { api } from '@api/client';
import { CHAT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  follow_up_suggestions?: string[];
  created_at?: string;
}

interface Quota {
  used: number;
  total: number;
}

export default function ChatThreadScreen() {
  const { session_id, template_id } = useLocalSearchParams<{
    session_id: string;
    template_id?: string;
  }>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [initialAskDone, setInitialAskDone] = useState(false);

  // Load session data
  useFocusEffect(
    useCallback(() => {
      if (!session_id) return;
      (async () => {
        setLoading(true);
        try {
          const [sessRes, quotaRes] = await Promise.all([
            api.get(CHAT.SESSION(session_id)),
            api.get(CHAT.QUOTA).catch(() => null),
          ]);
          setSessionData(sessRes);
          setMessages(sessRes?.messages || []);
          setSessionEnded(sessRes?.status === 'ended');
          setQuota(quotaRes);
        } catch (err: any) {
          setError(err.message || 'Failed to load session');
        } finally {
          setLoading(false);
        }
      })();
    }, [session_id])
  );

  // Auto-fire template question on first load
  useEffect(() => {
    if (!loading && template_id && messages.length === 0 && !initialAskDone) {
      setInitialAskDone(true);
      handleAsk(template_id);
    }
  }, [loading, template_id, messages.length, initialAskDone]);

  const handleAsk = async (templateId: string) => {
    if (!session_id) return;
    setSending(true);
    setError('');
    try {
      const res = await api.post(CHAT.ASK(session_id), {
        template_id: templateId,
        is_voice: false,
      });

      // Add both the user question and AI response
      const newMessages: ChatMessage[] = [];
      if (res.user_message) newMessages.push(res.user_message);
      if (res.assistant_message) newMessages.push(res.assistant_message);

      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);
      }

      // Refresh quota
      api.get(CHAT.QUOTA).then((q) => setQuota(q)).catch(() => {});
    } catch (err: any) {
      if (err.status === 429) {
        setError('Question limit reached. Upgrade your plan for more.');
      } else {
        setError(err.message || 'Failed to ask question');
      }
    } finally {
      setSending(false);
    }
  };

  const handleFollowUp = async (text?: string) => {
    const questionText = text || inputText.trim();
    if (!questionText || !session_id) return;

    // Add optimistic user message
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: questionText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setSending(true);
    setError('');

    try {
      const res = await api.post(CHAT.FOLLOW_UP(session_id), {
        text: questionText,
        is_voice: false,
      });

      // Replace temp message and add AI response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempMsg.id);
        const newMsgs: ChatMessage[] = [];
        if (res.user_message) newMsgs.push(res.user_message);
        if (res.assistant_message) newMsgs.push(res.assistant_message);
        return [...filtered, ...newMsgs];
      });

      api.get(CHAT.QUOTA).then((q) => setQuota(q)).catch(() => {});
    } catch (err: any) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      if (err.status === 429) {
        setError('Question limit reached. Upgrade your plan for more.');
      } else {
        setError(err.message || 'Failed to send follow-up');
      }
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = () => {
    Alert.alert('End Session', 'Are you sure you want to end this chat session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(CHAT.END(session_id));
            setSessionEnded(true);
          } catch (err: any) {
            setError(err.message || 'Failed to end session');
          }
        },
      },
    ]);
  };

  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    if (messages.length > 0) scrollToEnd();
  }, [messages.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {sessionData?.life_area_name || 'Chat'}
          </Text>
          {quota && <QuotaBadge used={quota.used} total={quota.total} />}
        </View>
        {!sessionEnded && (
          <Pressable onPress={handleEndSession} hitSlop={10}>
            <Text style={styles.endBtn}>End</Text>
          </Pressable>
        )}
      </View>

      {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <LoadingSpinner message="Loading chat..." />
      ) : (
        <>
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => (
              <ChatBubble
                role={item.role}
                content={item.content}
                follow_up_suggestions={item.follow_up_suggestions}
                timestamp={item.created_at}
                onSuggestionPress={(text) => handleFollowUp(text)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} style={{ opacity: 0.3 }} />
                <Text style={styles.emptyChatText}>Your conversation will appear here</Text>
              </View>
            }
            onContentSizeChange={scrollToEnd}
          />

          {/* Sending indicator */}
          {sending && (
            <View style={styles.typingRow}>
              <View style={styles.typingDots}>
                <View style={styles.dot} />
                <View style={[styles.dot, { opacity: 0.6 }]} />
                <View style={[styles.dot, { opacity: 0.3 }]} />
              </View>
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          )}

          {/* Session ended banner */}
          {sessionEnded && (
            <View style={styles.endedBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.muted} />
              <Text style={styles.endedText}>Session ended</Text>
            </View>
          )}

          {/* Input bar */}
          {!sessionEnded && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={0}
            >
              <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask a follow-up..."
                  placeholderTextColor={colors.muted}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  editable={!sending}
                />
                <Pressable
                  style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
                  onPress={() => handleFollowUp()}
                  disabled={!inputText.trim() || sending}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={inputText.trim() && !sending ? colors.text : colors.muted}
                  />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1, gap: 4 },
  headerTitle: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  endBtn: { ...typography.styles.label, color: colors.malefic },
  messageList: { paddingVertical: 12 },
  emptyChat: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyChatText: { ...typography.styles.bodySmall, color: colors.muted },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  typingText: { ...typography.styles.caption, color: colors.muted },
  endedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.panelSoft,
  },
  endedText: { ...typography.styles.caption, color: colors.muted },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.panel,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    ...typography.styles.bodySmall,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.panelSoft,
  },
});
