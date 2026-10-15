// Root navigation. This is the top of the whole app: the unauthenticated
// screens (Welcome, Login, Register) plus the main app, which lives inside
// the (tabs) group as its own separate navigator (see app/(tabs)/_layout.tsx).
//
// headerShown is off everywhere because every screen in our designs draws
// its own header/back button rather than using the native one.
//
// RootLayoutNav also acts as a protected-route guard: if there's no
// Supabase session and the user is somehow sitting inside the (tabs)
// group, it redirects back to Welcome instead of letting them stay.

import { colors } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
  if (loading) return;
  const inTabsGroup = segments[0] === '(tabs)';

  if (!session && inTabsGroup) {
    router.replace('/');
  } else if (session && !inTabsGroup) {
    router.replace('/explore');
  }
}, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background,
  },
};