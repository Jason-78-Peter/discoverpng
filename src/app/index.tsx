// The Welcome screen — the very first thing a user sees.
// app/index.tsx is the route shown at the root of the app ("/").

import { colors } from '@/constants/colors';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoMark}>PNG</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>Discover PNG</Text>
        <Text style={styles.subtitle}>
          Find places to visit, where to stay, and real reviews from people
          who've been there — across Papua New Guinea.
        </Text>
      </View>

      <Link href="/login" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 28,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});