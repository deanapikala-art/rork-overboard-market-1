import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function IndexPage() {
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    if (!hasNavigated && isMounted) {
      setHasNavigated(true);
      
      const timer = setTimeout(() => {
        if (isMounted) {
          router.replace('/welcome');
        }
      }, 0);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [router, hasNavigated]);

  return <View style={{ flex: 1 }} />;
}
