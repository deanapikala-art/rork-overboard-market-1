import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafetyFilterRule,
  SafetyCheckResult,
  checkMessageSafety,
  sanitizeMessage,
} from '@/app/utils/safetyFilters';

export interface FlaggedMessage {
  flagId: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  ruleId: string;
  matchedContent: string;
  severity: string;
  status: 'pending' | 'reviewed' | 'false_positive' | 'confirmed_unsafe' | 'resolved';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface UserSafetyWarning {
  warningId: string;
  userId: string;
  messageId?: string;
  warningType: 'suspicious_link' | 'off_platform_payment' | 'contact_sharing' | 'scam_keywords' | 'impersonation';
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface UserSafetyScore {
  userId: string;
  safetyScore: number;
  warningsCount: number;
  blocksCount: number;
  reportsReceived: number;
  falsePositives: number;
  lastIncidentAt?: string;
  isRestricted: boolean;
  restrictedUntil?: string;
  notes?: string;
}

const STORAGE_KEY_FLAGGED = '@safety_flagged_messages';
const STORAGE_KEY_WARNINGS = '@safety_warnings';
const STORAGE_KEY_SCORES = '@safety_scores';

export const [SafetyFiltersProvider, useSafetyFilters] = createContextHook(() => {
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [userWarnings, setUserWarnings] = useState<UserSafetyWarning[]>([]);
  const [safetyScores, setSafetyScores] = useState<Record<string, UserSafetyScore>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [flaggedData, warningsData, scoresData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_FLAGGED),
        AsyncStorage.getItem(STORAGE_KEY_WARNINGS),
        AsyncStorage.getItem(STORAGE_KEY_SCORES),
      ]);

      if (flaggedData) setFlaggedMessages(JSON.parse(flaggedData));
      if (warningsData) setUserWarnings(JSON.parse(warningsData));
      if (scoresData) setSafetyScores(JSON.parse(scoresData));
    } catch (error) {
      console.error('[SafetyFilters] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useState(() => {
    loadData();
  });

  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_FLAGGED, JSON.stringify(flaggedMessages)),
        AsyncStorage.setItem(STORAGE_KEY_WARNINGS, JSON.stringify(userWarnings)),
        AsyncStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(safetyScores)),
      ]);
    } catch (error) {
      console.error('[SafetyFilters] Error saving data:', error);
    }
  }, [flaggedMessages, userWarnings, safetyScores]);

  const checkMessage = useCallback((message: string, customRules?: SafetyFilterRule[]): SafetyCheckResult => {
    return checkMessageSafety(message, customRules);
  }, []);

  const flagMessage = useCallback((
    messageId: string,
    conversationId: string,
    senderId: string,
    checkResult: SafetyCheckResult
  ) => {
    const newFlags: FlaggedMessage[] = checkResult.matchedRules.map(({ rule, matchedContent }) => ({
      flagId: `FLAG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      conversationId,
      senderId,
      ruleId: rule.ruleId,
      matchedContent,
      severity: rule.severity,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    }));

    setFlaggedMessages(prev => [...prev, ...newFlags]);

    const score = safetyScores[senderId] || createDefaultScore(senderId);
    score.warningsCount += checkResult.matchedRules.length;
    score.safetyScore = Math.max(0, score.safetyScore - (checkResult.shouldBlock ? 10 : 5));
    score.lastIncidentAt = new Date().toISOString();

    setSafetyScores(prev => ({ ...prev, [senderId]: score }));

    console.log(`[SafetyFilters] Flagged message ${messageId} with ${newFlags.length} violations`);
  }, [safetyScores]);

  const addUserWarning = useCallback((
    userId: string,
    warningType: UserSafetyWarning['warningType'],
    message: string,
    messageId?: string
  ) => {
    const newWarning: UserSafetyWarning = {
      warningId: `WARN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      messageId,
      warningType,
      message,
      acknowledged: false,
      createdAt: new Date().toISOString(),
    };

    setUserWarnings(prev => [...prev, newWarning]);
    console.log(`[SafetyFilters] Added warning for user ${userId}`);
  }, []);

  const acknowledgeWarning = useCallback((warningId: string) => {
    setUserWarnings(prev =>
      prev.map(warning =>
        warning.warningId === warningId
          ? { ...warning, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : warning
      )
    );
  }, []);

  const getUserSafetyScore = useCallback((userId: string): UserSafetyScore => {
    return safetyScores[userId] || createDefaultScore(userId);
  }, [safetyScores]);

  const updateSafetyScore = useCallback((userId: string, updates: Partial<UserSafetyScore>) => {
    setSafetyScores(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        ...updates,
      },
    }));
  }, []);

  const getPendingWarnings = useCallback((userId: string): UserSafetyWarning[] => {
    return userWarnings.filter(w => w.userId === userId && !w.acknowledged);
  }, [userWarnings]);

  const getFlaggedMessagesBySender = useCallback((senderId: string): FlaggedMessage[] => {
    return flaggedMessages.filter(f => f.senderId === senderId);
  }, [flaggedMessages]);

  const reviewFlaggedMessage = useCallback((
    flagId: string,
    status: FlaggedMessage['status'],
    adminNotes?: string,
    reviewedBy?: string
  ) => {
    setFlaggedMessages(prev =>
      prev.map(flag =>
        flag.flagId === flagId
          ? {
              ...flag,
              status,
              adminNotes,
              reviewedBy,
              reviewedAt: new Date().toISOString(),
            }
          : flag
      )
    );

    if (status === 'false_positive') {
      const flag = flaggedMessages.find(f => f.flagId === flagId);
      if (flag) {
        const score = getUserSafetyScore(flag.senderId);
        score.falsePositives += 1;
        score.safetyScore = Math.min(100, score.safetyScore + 3);
        updateSafetyScore(flag.senderId, score);
      }
    }
  }, [flaggedMessages, getUserSafetyScore, updateSafetyScore]);

  const sanitize = useCallback((message: string): string => {
    return sanitizeMessage(message);
  }, []);

  useState(() => {
    saveData();
  });

  return {
    flaggedMessages,
    userWarnings,
    safetyScores,
    isLoading,
    checkMessage,
    flagMessage,
    addUserWarning,
    acknowledgeWarning,
    getUserSafetyScore,
    updateSafetyScore,
    getPendingWarnings,
    getFlaggedMessagesBySender,
    reviewFlaggedMessage,
    sanitize,
  };
});

function createDefaultScore(userId: string): UserSafetyScore {
  return {
    userId,
    safetyScore: 100,
    warningsCount: 0,
    blocksCount: 0,
    reportsReceived: 0,
    falsePositives: 0,
    isRestricted: false,
  };
}
