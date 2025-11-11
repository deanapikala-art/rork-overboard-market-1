import React from 'react';
import { Image as ExpoImage, ImageProps } from 'expo-image';
import { View } from 'react-native';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  source: { uri?: string | null } | string | null | undefined;
  fallbackColor?: string;
}

export function SafeImage({ source, fallbackColor = '#E5E5E5', style, ...props }: SafeImageProps) {
  const uri = typeof source === 'string' ? source : source?.uri;
  
  if (!uri || uri.trim() === '') {
    return <View style={[style, { backgroundColor: fallbackColor }]} />;
  }

  return (
    <ExpoImage
      {...props}
      source={{ uri }}
      style={style}
    />
  );
}
