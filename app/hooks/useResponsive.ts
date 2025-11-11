import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import responsive from '@/constants/responsive';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...responsive,
    width: dimensions.width,
    height: dimensions.height,
    breakpoint: responsive.getBreakpoint(),
    isSmallPhone: responsive.getBreakpoint() === 'phone-small',
    isPhone: responsive.getBreakpoint() === 'phone' || responsive.getBreakpoint() === 'phone-small',
    isTablet: responsive.getBreakpoint() === 'tablet',
    isDesktop: responsive.getBreakpoint() === 'desktop',
    numColumns: responsive.getNumColumns(),
    cardWidth: responsive.getCardWidth(),
  };
};
