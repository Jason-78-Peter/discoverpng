// Register screen — now signs up with real Supabase auth.

import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleRegister() {
    if (!name.trim()) {
      setError('Please enter your name.');
      setNotice(null);
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      setNotice(null);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setNotice(null);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setNotice(null);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // Signed up and already logged in (email confirmation is off).
      router.replace('/explore');
    } else {
      // Email confirmation is required before a session is issued.
      setNotice('Account created! Check your email to confirm it, then log in.');
    }
  }

  return (
    <View style={styles.container}>
      <Link href="/" asChild>
  <Pressable style={styles.backButton}>
    <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
  </Pressable>
</Link>

      <View style={styles.headerBlock}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Save places and write reviews as you explore.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
          <Text style={styles.hint}>Must be at least 8 characters.</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create Account</Text>}
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/login" asChild>
          <Pressable>
            <Text style={styles.footerLink}>Log in</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 28, gap: 24 },
  backButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerBlock: { gap: 6 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  input: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, fontSize: 14, color: colors.textPrimary },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingRight: 10 },
  passwordInput: { flex: 1, paddingVertical: 13, paddingHorizontal: 14, fontSize: 14, color: colors.textPrimary },
  eyeButton: { padding: 4 },
  hint: { fontSize: 12, color: colors.textSecondary },
  error: { fontSize: 13, color: colors.destructive },
  notice: { fontSize: 13, color: colors.primary },
  button: { width: '100%', paddingVertical: 15, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 13, color: colors.textSecondary },
  footerLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
});