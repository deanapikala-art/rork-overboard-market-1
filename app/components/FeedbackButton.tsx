import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { useFeedback } from '@/app/contexts/FeedbackContext';
import Colors from '@/app/constants/colors';

interface FeedbackButtonProps {
  variant?: 'floating' | 'inline';
}

export function FeedbackButton({ variant = 'floating' }: FeedbackButtonProps) {
  const { showFeedback } = useFeedback();

  if (variant === 'inline') {
    return (
      <TouchableOpacity 
        style={styles.inlineButton}
        onPress={showFeedback}
        activeOpacity={0.7}
      >
        <MessageSquare size={18} color={Colors.light.text} />
        <Text style={styles.inlineText}>Report Issue / Leave Feedback</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.floatingButton}
      onPress={showFeedback}
      activeOpacity={0.9}
    >
      <MessageSquare size={20} color={Colors.light.card} />
      <Text style={styles.floatingText}>Feedback</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: Colors.light.terracotta,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  floatingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  inlineText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
});
