import { useState, useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';
import { 
  getBreakpoint, 
  getNumColumns, 
  getCardWidth,
  containerPadding,
  horizontalPadding,
  gridGap,
  isIOS,
  isAndroid,
  isWeb,
  isTouchDevice,
  getContentMaxWidth,
  platformSelect,
  fontSize,
  spacing,
  borderRadius,
  iconSize,
  moderateScale,
  scale,
  verticalScale,
  ensureTouchTarget,
  isLandscape,
  getResponsiveValue,
} from '@/app/constants/responsive';

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

  const breakpoint = useMemo(() => getBreakpoint(), [dimensions]);
  const numColumns = useMemo(() => getNumColumns(), [dimensions]);
  const cardWidth = useMemo(() => getCardWidth(), [dimensions]);
  const padding = useMemo(() => containerPadding(), [dimensions]);
  const hPadding = useMemo(() => horizontalPadding(), [dimensions]);
  const gap = useMemo(() => gridGap(), [dimensions]);
  const maxWidth = useMemo(() => getContentMaxWidth(), [dimensions]);

  return {
    width: dimensions.width,
    height: dimensions.height,
    breakpoint,
    isSmallPhone: breakpoint === 'phone-small',
    isPhone: breakpoint === 'phone' || breakpoint === 'phone-small',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    numColumns,
    cardWidth,
    padding,
    horizontalPadding: hPadding,
    gridGap: gap,
    maxContentWidth: maxWidth,
    isIOS,
    isAndroid,
    isWeb,
    isTouchDevice: isTouchDevice(),
    isLandscape: isLandscape(),
    fontSize,
    spacing,
    borderRadius,
    iconSize,
    moderateScale,
    scale,
    verticalScale,
    ensureTouchTarget,
    getResponsiveValue,
    platformSelect,
  };
};
