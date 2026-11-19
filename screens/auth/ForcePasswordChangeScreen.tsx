import React, { useState } from 'react';
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/common/AppButton';
import { AppText as Text } from '../../components/common/AppText';
import { Field } from '../../components/common/Field';
import { BRAND_FONT, BRAND_NAME, SECONDARY_FONT } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import { completeEmployeePasswordChange } from '../../services/firebaseEmployeeProvisioningService';

export function ForcePasswordChangeScreen({ onComplete }: { onComplete: () => Promise<void> }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (newPassword.length < 8) return setError('Choose a password with at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('The passwords do not match.');
    setSaving(true);
    try {
      await completeEmployeePasswordChange(newPassword);
      await onComplete();
    } catch {
      setError('Could not save your new password. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return <SafeAreaView style={styles.safe}>
    <ImageBackground source={require('../../assets/paper-grid.jpg')} resizeMode="cover" imageStyle={styles.paper} style={StyleSheet.absoluteFill} />
    <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.brand}>{BRAND_NAME}</Text>
      <Text style={styles.tagline}>Payroll for your café team</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Create your password</Text>
        <Text style={styles.description}>For your account's security, replace the temporary password before opening your dashboard.</Text>
        <Field label="NEW PASSWORD" icon="lock-reset" value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} placeholder="At least 8 characters" />
        <Field label="CONFIRM NEW PASSWORD" icon="lock-check-outline" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} placeholder="Enter it again" />
        <Text onPress={() => setShowPassword(value => !value)} style={styles.show}>{showPassword ? 'Hide password' : 'Show password'}</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <AppButton title={saving ? 'Saving...' : 'Save new password'} onPress={submit} disabled={saving} />
        {saving ? <ActivityIndicator color={COLORS.brown} /> : null}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  paper: { opacity: 0.18 },
  keyboardArea: { flex: 1 },
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 5 },
  brand: { color: COLORS.darkBrown, fontSize: 38, lineHeight: 46, textAlign: 'center', fontWeight: '900', fontFamily: BRAND_FONT },
  tagline: { color: COLORS.muted, textAlign: 'center', fontSize: 16, fontFamily: SECONDARY_FONT, marginBottom: 25 },
  card: { width: '100%', maxWidth: 520, backgroundColor: COLORS.background, borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.darkBrown, fontSize: 23, fontWeight: '800' },
  description: { color: COLORS.muted, lineHeight: 21 },
  show: { color: COLORS.brown, textAlign: 'right', marginTop: -8, fontSize: 12, fontWeight: '700' },
  error: { color: '#9D2F25', fontSize: 13, fontWeight: '600' },
});
