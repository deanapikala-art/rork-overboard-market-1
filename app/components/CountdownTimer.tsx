import { Clock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { upcomingEvent } from '@/mocks/liveEvent';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const difference = +new Date(targetDate) - +new Date();
  
  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  
  return null;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    calculateTimeLeft(upcomingEvent.startDate)
  );
  const [isEventLive, setIsEventLive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(upcomingEvent.startDate);
      const end = new Date(upcomingEvent.endDate);

      if (now >= start && now <= end) {
        setIsEventLive(true);
        setTimeLeft(null);
      } else if (now < start) {
        setTimeLeft(calculateTimeLeft(upcomingEvent.startDate));
        setIsEventLive(false);
      } else {
        setTimeLeft(null);
        setIsEventLive(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePress = () => {
    router.push('/fair-stage');
  };

  if (isEventLive) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={['#FF4444', '#CC0000']}
          style={styles.container}
        >
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>🎪 LIVE EVENT IN PROGRESS</Text>
          <Text style={styles.tapText}>Tap to join →</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (!timeLeft) {
    return null;
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#FFA07A', '#FF8C69']}
        style={styles.container}
      >
        <Clock size={16} color="#FFF" />
        <Text style={styles.label}>Next Event:</Text>
        <View style={styles.timeContainer}>
          {timeLeft.days > 0 && (
            <Text style={styles.timeText}>{timeLeft.days}d </Text>
          )}
          <Text style={styles.timeText}>
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  liveText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  tapText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFF',
    fontVariant: ['tabular-nums'] as any,
  },
});
