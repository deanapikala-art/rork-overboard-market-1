import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { events } from '@/mocks/events';

interface EventGuardResult {
  event: typeof events[0] | null;
  isLoading: boolean;
  canShowLiveFeatures: boolean;
  canShowVideo: boolean;
  canShowChat: boolean;
  shouldRedirect: boolean;
}

interface EventGuardOptions {
  slug: string;
  pollInterval?: number;
}

export function useEventGuard({ slug, pollInterval = 5000 }: EventGuardOptions): EventGuardResult {
  const [event, setEvent] = useState<typeof events[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkEventStatus = () => {
      const foundEvent = events.find(e => e.id === slug);
      
      if (!foundEvent) {
        setIsLoading(false);
        setEvent(null);
        return;
      }

      if (previousStatus === 'live' && (foundEvent.status === 'past' || foundEvent.status === 'upcoming')) {
        console.log('[EventGuard] Event status changed from live to', foundEvent.status);
        setShouldRedirect(true);
        
        Alert.alert(
          'Event Ended',
          'This event has ended. Browse the recap or visit the Marketplace.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace(`/events/${slug}` as any);
              }
            }
          ]
        );
      }

      setEvent(foundEvent);
      setPreviousStatus(foundEvent.status);
      setIsLoading(false);
    };

    checkEventStatus();

    const interval = setInterval(checkEventStatus, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [slug, pollInterval, previousStatus]);

  useEffect(() => {
    if (!event) return;

    if (event.status === 'past') {
      console.log('[EventGuard] Event is in past status, redirecting...');
      Alert.alert(
        'Event Ended',
        'This event has ended. Browse the recap or visit the Marketplace.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace(`/events/${slug}` as any);
            }
          }
        ]
      );
    }
  }, [event, slug]);

  const canShowLiveFeatures = event?.status === 'live';
  const canShowVideo = canShowLiveFeatures;
  const canShowChat = canShowLiveFeatures && event.allowChat === true;

  return {
    event,
    isLoading,
    canShowLiveFeatures,
    canShowVideo,
    canShowChat,
    shouldRedirect,
  };
}
