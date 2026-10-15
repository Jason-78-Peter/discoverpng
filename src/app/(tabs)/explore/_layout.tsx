// Stack navigator for the Explore tab: the place list, then drilling into
// a single place's detail, then writing a review for it.

import { Stack } from 'expo-router';

export default function ExploreStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add-review" />
    </Stack>
  );
}