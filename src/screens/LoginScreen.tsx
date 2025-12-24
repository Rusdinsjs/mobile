// Login Screen with Dynamic Theming
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { spacing, borderRadius, shadows, typography } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useColors } from '../store/themeStore';
import { authAPI } from '../api/client';

export default function LoginScreen() {
    const colors = useColors();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isSubmittingRef = useRef(false); // Mutex lock
    const { login } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) { Alert.alert('Error', 'Email dan password harus diisi'); return; }
        if (isLoading || isSubmittingRef.current) return; // Double guard

        isSubmittingRef.current = true;
        setIsLoading(true);

        try {
            console.log('📱 Attempting login...');
            const response = await authAPI.login({ email, password });
            const { user, access_token, refresh_token } = response.data;
            console.log('✅ Login successful');
            login(user, access_token, refresh_token);
        } catch (error: any) {
            console.log('❌ Login failed:', error.response?.data?.error);
            const message = error.response?.data?.error || 'Login gagal';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
    };

    const styles = createStyles(colors);

    return (
        <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={[styles.logo, { backgroundColor: colors.accent }]}><Text style={styles.logoText}>⏰</Text></View>
                    <Text style={[styles.appName, { color: colors.textPrimary }]}>AttendX</Text>
                    <Text style={[styles.tagline, { color: colors.textMuted }]}>Sistem Presensi Karyawan</Text>
                </View>

                <View style={[styles.form, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Masuk</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
                        <TextInput style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary }]} placeholder="email@perusahaan.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
                        <View style={[styles.passwordContainer, { backgroundColor: colors.surfaceLight }]}>
                            <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}><Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text></TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.buttonText, { color: colors.primary }]}>Masuk</Text>}
                    </TouchableOpacity>
                </View>

                <Text style={[styles.footer, { color: colors.textMuted }]}>v1.0.0 • @by roesch</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
    logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
    logo: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, ...shadows.glow },
    logoText: { fontSize: 40 },
    appName: { ...typography.h1 },
    tagline: { ...typography.bodySmall, marginTop: spacing.xs },
    form: { borderRadius: borderRadius.xl, padding: spacing.xl, ...shadows.md },
    formTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.xl },
    inputGroup: { marginBottom: spacing.lg },
    label: { ...typography.caption, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: { borderRadius: borderRadius.md, padding: spacing.md, fontSize: 14 },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md },
    passwordInput: { flex: 1, padding: spacing.md, fontSize: 14 },
    eyeButton: { padding: spacing.md },
    eyeIcon: { fontSize: 16 },
    button: { borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { ...typography.body, fontWeight: '700' },
    footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.xxl },
});
