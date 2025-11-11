import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';

export const [FeedbackContext, useFeedback] = createContextHook(() => {
  const [isVisible, setIsVisible] = useState(false);

  const showFeedback = useCallback(() => {
    console.log('📢 Opening feedback modal');
    setIsVisible(true);
  }, []);

  const hideFeedback = useCallback(() => {
    console.log('📢 Closing feedback modal');
    setIsVisible(false);
  }, []);

  return useMemo(
    () => ({
      isVisible,
      showFeedback,
      hideFeedback,
    }),
    [isVisible, showFeedback, hideFeedback]
  );
});
