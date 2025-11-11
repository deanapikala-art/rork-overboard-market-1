import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CartProvider } from './contexts/CartContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { AuthContext } from './contexts/AuthContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { VendorAuthProvider } from './contexts/VendorAuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { SavedForLaterProvider } from './contexts/SavedForLaterContext';
import { MessagingContext } from './contexts/MessagingContext';
import { MessagingCenterProvider } from './contexts/MessagingCenterContext';
import { AutoResponderProvider } from './contexts/AutoResponderContext';
import { ShoutoutsProvider } from './contexts/ShoutoutsContext';
import { FeedbackContext } from './contexts/FeedbackContext';
import { VendorLiveProvider } from './contexts/VendorLiveContext';
import { AdminStatsProvider } from './contexts/AdminStatsContext';
import { AdminControlsProvider } from './contexts/AdminControlsContext';
import { AdminNotificationsProvider } from './contexts/AdminNotificationsContext';
import { CustomerNotificationsProvider } from './contexts/CustomerNotificationsContext';
import { TrustScoreContext } from './contexts/TrustScoreContext';
import { PolicyAcknowledgmentProvider } from './contexts/PolicyAcknowledgmentContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { SafetyFiltersProvider } from './contexts/SafetyFiltersContext';
import { WorkshopsProvider } from './contexts/WorkshopsContext';
import { VendorSalesProvider } from './contexts/VendorSalesContext';
import { trpc, trpcClient } from '../lib/trpc';
import { startTrackingPolling, stopTrackingPolling } from './utils/deliveryTracking';

LogBox.ignoreLogs([
  'deep imports from the "react-native" package are deprecated',
  'source.uri should not be an empty string',
]);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
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
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
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
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthContext>
            <CustomerAuthProvider>
              <PolicyAcknowledgmentProvider>
              <CustomerNotificationsProvider>
                <TrustScoreContext>
                  <VendorAuthProvider>
                <AdminAuthProvider>
                  <ReportsProvider>
                  <AdminStatsProvider>
                    <AdminControlsProvider>
                      <AdminNotificationsProvider>
                    <FavoritesProvider>
                    <SavedForLaterProvider>
                      <MessagingContext>
                        <MessagingCenterProvider>
                          <SafetyFiltersProvider>
                          <AutoResponderProvider>
                        <ShoutoutsProvider>
                          <VendorLiveProvider>
                            <WorkshopsProvider>
                              <VendorSalesProvider>
                            <OrdersProvider>
                              <CartProvider>
                                <FeedbackContext>
                                  <RootLayoutNav />
                                </FeedbackContext>
                              </CartProvider>
                            </OrdersProvider>
                              </VendorSalesProvider>
                            </WorkshopsProvider>
                          </VendorLiveProvider>
                        </ShoutoutsProvider>
                          </AutoResponderProvider>
                          </SafetyFiltersProvider>
                        </MessagingCenterProvider>
                      </MessagingContext>
                    </SavedForLaterProvider>
                    </FavoritesProvider>
                      </AdminNotificationsProvider>
                    </AdminControlsProvider>
                  </AdminStatsProvider>
                  </ReportsProvider>
                </AdminAuthProvider>
                  </VendorAuthProvider>
                </TrustScoreContext>
              </CustomerNotificationsProvider>
              </PolicyAcknowledgmentProvider>
            </CustomerAuthProvider>
          </AuthContext>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
