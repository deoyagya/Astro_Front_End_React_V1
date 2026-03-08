import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  follow_up_suggestions?: string[];
  timestamp?: string;
  onSuggestionPress?: (text: string) => void;
}

export function ChatBubble({
  role,
  content,
  follow_up_suggestions,
  timestamp,
  onSuggestionPress,
}: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.wrapper, isUser && styles.wrapperUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color={colors.accent} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.content, isUser && styles.contentUser]}>{content}</Text>
        {timestamp && (
          <Text style={styles.timestamp}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Follow-up suggestions */}
      {!isUser && follow_up_suggestions && follow_up_suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {follow_up_suggestions.map((text, idx) => (
            <Pressable
              key={idx}
              style={styles.suggestionChip}
              onPress={() => onSuggestionPress?.(text)}
            >
              <Ionicons name="chatbubble-outline" size={12} color={colors.accent} />
              <Text style={styles.suggestionText} numberOfLines={2}>{text}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  wrapperUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.panelSoft,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    ...typography.styles.bodySmall,
    color: colors.text,
    lineHeight: 22,
  },
  contentUser: {
    color: '#ffffff',
  },
  timestamp: {
    ...typography.styles.caption,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  suggestions: {
    gap: 6,
    marginTop: 6,
    marginLeft: 36,
    maxWidth: '78%',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: `${colors.accent}10`,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  suggestionText: {
    ...typography.styles.caption,
    color: colors.accent,
    flex: 1,
  },
});
