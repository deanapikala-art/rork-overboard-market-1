import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/welcome');
  }, [router]);

  return <View style={{ flex: 1 }} />;
}
