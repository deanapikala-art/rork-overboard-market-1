import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from "react";
import { LogBox, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CartProvider } from '@/app/contexts/CartContext';
import { OrdersProvider } from '@/app/contexts/OrdersContext';
import { AuthContext } from '@/app/contexts/AuthContext';
import { CustomerAuthProvider } from '@/app/contexts/CustomerAuthContext';
import { AdminAuthProvider } from '@/app/contexts/AdminAuthContext';
import { VendorAuthProvider } from '@/app/contexts/VendorAuthContext';
import { FavoritesProvider } from '@/app/contexts/FavoritesContext';
import { SavedForLaterProvider } from '@/app/contexts/SavedForLaterContext';
import { MessagingContext } from '@/app/contexts/MessagingContext';
import { MessagingCenterProvider } from '@/app/contexts/MessagingCenterContext';
import { AutoResponderProvider } from '@/app/contexts/AutoResponderContext';
import { ShoutoutsProvider } from '@/app/contexts/ShoutoutsContext';
import { FeedbackContext } from '@/app/contexts/FeedbackContext';
import { VendorLiveProvider } from '@/app/contexts/VendorLiveContext';
import { AdminStatsProvider } from '@/app/contexts/AdminStatsContext';
import { AdminControlsProvider } from '@/app/contexts/AdminControlsContext';
import { AdminNotificationsProvider } from '@/app/contexts/AdminNotificationsContext';
import { CustomerNotificationsProvider } from '@/app/contexts/CustomerNotificationsContext';
import { TrustScoreContext } from '@/app/contexts/TrustScoreContext';
import { PolicyAcknowledgmentProvider } from '@/app/contexts/PolicyAcknowledgmentContext';
import { ReportsProvider } from '@/app/contexts/ReportsContext';
import { SafetyFiltersProvider } from '@/app/contexts/SafetyFiltersContext';
import { WorkshopsProvider } from '@/app/contexts/WorkshopsContext';
import { VendorSalesProvider } from '@/app/contexts/VendorSalesContext';
import { trpc, trpcClient } from '@/lib/trpc';
import { startTrackingPolling, stopTrackingPolling } from '@/app/utils/deliveryTracking';

LogBox.ignoreLogs([
  'deep imports from the "react-native" package are deprecated',
  'source.uri should not be an empty string',
  'Setting a timer',
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Sending \`onAnimatedValueUpdate\` with no listeners registered',
  'Require cycle:',
  'No route named',
  'Layout children',
]);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    console.error('[ErrorBoundary] Error message:', error.message);
    console.error('[ErrorBoundary] Error stack:', error.stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorBoundaryStyles.container}>
          <View style={errorBoundaryStyles.content}>
            <Text style={errorBoundaryStyles.title}>Oops! Something went wrong</Text>
            <Text style={errorBoundaryStyles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Text style={errorBoundaryStyles.errorDetails}>
              Check console for more details
            </Text>
            <TouchableOpacity
              style={errorBoundaryStyles.button}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={errorBoundaryStyles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorBoundaryStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2B3440',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6A6F73',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#EE6E56',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerBackTitleVisible: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="product/[id]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="vendor/[id]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="fair-stage" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="docks-map" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="vendor-auth" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="admin-auth" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="order/[id]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="welcome" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="user-type-selection" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="customer-auth" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="vendor-onboarding" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="market-selection" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="chat/[vendorId]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="community/shoutouts-wall" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="community/bulletin" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="live" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="shop-local" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="system-check" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="walk-the-fair" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="past-purchases" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="messages/inbox" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="messages/thread" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="vendor/auto-responder-settings" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="my-reports" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="workshops" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="vendor-workshops" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="vendor-sales" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="sales" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        if (isMounted) {
          setAppReady(true);
        }
      }
    }

    prepare();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    if (appReady && isMounted) {
      SplashScreen.hideAsync();
    }
    
    return () => {
      isMounted = false;
    };
  }, [appReady]);

  useEffect(() => {
    console.log('[DeliveryTracking] Initializing auto-tracking polling system');
    const interval = startTrackingPolling(30);

    return () => {
      console.log('[DeliveryTracking] Cleaning up auto-tracking polling system');
      stopTrackingPolling(interval);
    };
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <ErrorBoundary>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ErrorBoundary>
          <AuthContext>
            <ErrorBoundary>
            <CustomerAuthProvider>
              <ErrorBoundary>
              <PolicyAcknowledgmentProvider>
              <ErrorBoundary>
              <CustomerNotificationsProvider>
                <ErrorBoundary>
                <TrustScoreContext>
                  <ErrorBoundary>
                  <VendorAuthProvider>
                <ErrorBoundary>
                <AdminAuthProvider>
                  <ErrorBoundary>
                  <ReportsProvider>
                  <ErrorBoundary>
                  <AdminStatsProvider>
                    <ErrorBoundary>
                    <AdminControlsProvider>
                      <ErrorBoundary>
                      <AdminNotificationsProvider>
                    <ErrorBoundary>
                    <FavoritesProvider>
                    <ErrorBoundary>
                    <SavedForLaterProvider>
                      <ErrorBoundary>
                      <MessagingContext>
                        <ErrorBoundary>
                        <MessagingCenterProvider>
                          <ErrorBoundary>
                          <SafetyFiltersProvider>
                          <ErrorBoundary>
                          <AutoResponderProvider>
                        <ErrorBoundary>
                        <ShoutoutsProvider>
                          <ErrorBoundary>
                          <VendorLiveProvider>
                            <ErrorBoundary>
                            <WorkshopsProvider>
                              <ErrorBoundary>
                              <VendorSalesProvider>
                            <ErrorBoundary>
                            <OrdersProvider>
                              <ErrorBoundary>
                              <CartProvider>
                                <ErrorBoundary>
                                <FeedbackContext>
                                  <RootLayoutNav />
                                </FeedbackContext>
                                </ErrorBoundary>
                              </CartProvider>
                              </ErrorBoundary>
                            </OrdersProvider>
                            </ErrorBoundary>
                              </VendorSalesProvider>
                              </ErrorBoundary>
                            </WorkshopsProvider>
                            </ErrorBoundary>
                          </VendorLiveProvider>
                          </ErrorBoundary>
                        </ShoutoutsProvider>
                        </ErrorBoundary>
                          </AutoResponderProvider>
                          </ErrorBoundary>
                          </SafetyFiltersProvider>
                          </ErrorBoundary>
                        </MessagingCenterProvider>
                        </ErrorBoundary>
                      </MessagingContext>
                      </ErrorBoundary>
                    </SavedForLaterProvider>
                    </ErrorBoundary>
                    </FavoritesProvider>
                    </ErrorBoundary>
                      </AdminNotificationsProvider>
                      </ErrorBoundary>
                    </AdminControlsProvider>
                    </ErrorBoundary>
                  </AdminStatsProvider>
                  </ErrorBoundary>
                  </ReportsProvider>
                  </ErrorBoundary>
                </AdminAuthProvider>
                </ErrorBoundary>
                  </VendorAuthProvider>
                  </ErrorBoundary>
                </TrustScoreContext>
                </ErrorBoundary>
              </CustomerNotificationsProvider>
              </ErrorBoundary>
              </PolicyAcknowledgmentProvider>
              </ErrorBoundary>
            </CustomerAuthProvider>
            </ErrorBoundary>
          </AuthContext>
          </ErrorBoundary>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
    </ErrorBoundary>
  );
}
