import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

export const BREAKPOINTS = {
  PHONE_SMALL: 375,
  PHONE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
} as const;

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

export const isSmallPhone = SCREEN_WIDTH < BREAKPOINTS.PHONE_SMALL;
export const isPhone = SCREEN_WIDTH < BREAKPOINTS.PHONE;
export const isTablet = SCREEN_WIDTH >= BREAKPOINTS.PHONE && SCREEN_WIDTH < BREAKPOINTS.TABLET;
export const isDesktop = SCREEN_WIDTH >= BREAKPOINTS.TABLET;

export const getBreakpoint = (): 'phone-small' | 'phone' | 'tablet' | 'desktop' => {
  if (SCREEN_WIDTH <= BREAKPOINTS.PHONE_SMALL) return 'phone-small';
  if (SCREEN_WIDTH <= BREAKPOINTS.PHONE) return 'phone';
  if (SCREEN_WIDTH <= BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
};

export const getNumColumns = (): number => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'phone-small':
      return 2;
    case 'phone':
      return 2;
    case 'tablet':
      return 3;
    case 'desktop':
      return 4;
    default:
      return 2;
  }
};

export const getCardWidth = (padding: number = 40, gap: number = 16): number => {
  const columns = getNumColumns();
  const totalGap = gap * (columns - 1);
  return (SCREEN_WIDTH - padding - totalGap) / columns;
};

export const scale = (size: number): number => {
  const guidelineBaseWidth = 375;
  return (SCREEN_WIDTH / guidelineBaseWidth) * size;
};

export const verticalScale = (size: number): number => {
  const guidelineBaseHeight = 812;
  return (SCREEN_HEIGHT / guidelineBaseHeight) * size;
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  base: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(30),
  '4xl': moderateScale(36),
  '5xl': moderateScale(48),
};

export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  base: moderateScale(16),
  lg: moderateScale(20),
  xl: moderateScale(24),
  '2xl': moderateScale(32),
  '3xl': moderateScale(40),
  '4xl': moderateScale(48),
};

export const containerPadding = (): number => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'phone-small':
      return spacing.md;
    case 'phone':
      return spacing.lg;
    case 'tablet':
      return spacing['2xl'];
    case 'desktop':
      return spacing['3xl'];
    default:
      return spacing.lg;
  }
};

export const horizontalPadding = (): number => {
  if (isWeb && SCREEN_WIDTH > BREAKPOINTS.DESKTOP) {
    return Math.min((SCREEN_WIDTH - BREAKPOINTS.DESKTOP) / 2, 200);
  }
  return containerPadding();
};

export const maxContainerWidth = (): number | string => {
  return isDesktop ? BREAKPOINTS.DESKTOP : '100%';
};

export const gridGap = (): number => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'phone-small':
      return spacing.sm;
    case 'phone':
      return spacing.md;
    case 'tablet':
    case 'desktop':
      return spacing.base;
    default:
      return spacing.md;
  }
};

export const borderRadius = {
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  full: 9999,
};

export const iconSize = {
  xs: moderateScale(14),
  sm: moderateScale(18),
  md: moderateScale(22),
  lg: moderateScale(28),
  xl: moderateScale(36),
  '2xl': moderateScale(48),
};

export const bannerHeight = (): number => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'phone-small':
      return verticalScale(200);
    case 'phone':
      return verticalScale(240);
    case 'tablet':
      return verticalScale(300);
    case 'desktop':
      return 360;
    default:
      return 240;
  }
};

export const logoSize = (): number => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'phone-small':
      return moderateScale(80);
    case 'phone':
      return moderateScale(100);
    case 'tablet':
      return moderateScale(120);
    case 'desktop':
      return 140;
    default:
      return 100;
  }
};

export const getResponsiveValue = <T,>(values: {
  phoneSmall?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  const breakpoint = getBreakpoint();
  return values[breakpoint === 'phone-small' ? 'phoneSmall' : breakpoint] ?? values.default;
};

export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

export const getOrientation = (): 'portrait' | 'landscape' => {
  return isLandscape() ? 'landscape' : 'portrait';
};

export const MIN_TOUCH_TARGET = 44;

export const ensureTouchTarget = (size: number): number => {
  return Math.max(size, MIN_TOUCH_TARGET);
};

export const getVideoAspectRatio = (): string => {
  return '16:9';
};

export const getVideoHeight = (width: number): number => {
  return (width * 9) / 16;
};

export const platformSelect = <T,>(options: {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
}): T => {
  if (Platform.OS === 'ios' && options.ios !== undefined) return options.ios;
  if (Platform.OS === 'android' && options.android !== undefined) return options.android;
  if (Platform.OS === 'web' && options.web !== undefined) return options.web;
  return options.default;
};

export const getContentMaxWidth = (): number | string => {
  if (isDesktop) return BREAKPOINTS.DESKTOP;
  if (isTablet) return BREAKPOINTS.TABLET;
  return '100%';
};

export const isTouchDevice = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

export const isHighDensity = (): boolean => {
  return pixelRatio >= 2;
};

export const responsive = {
  scale,
  verticalScale,
  moderateScale,
  fontSize,
  spacing,
  borderRadius,
  iconSize,
  containerPadding,
  horizontalPadding,
  maxContainerWidth,
  gridGap,
  bannerHeight,
  logoSize,
  getBreakpoint,
  getNumColumns,
  getCardWidth,
  getResponsiveValue,
  getOrientation,
  isLandscape,
  ensureTouchTarget,
  getVideoAspectRatio,
  getVideoHeight,
  platformSelect,
  getContentMaxWidth,
  isTouchDevice,
  isHighDensity,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  isWeb,
  isSmallPhone,
  isPhone,
  isTablet,
  isDesktop,
};

export default responsive;
