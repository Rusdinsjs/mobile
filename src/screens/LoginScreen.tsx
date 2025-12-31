// Login Screen with Dynamic Theming and Offline Login Support
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { spacing, borderRadius, shadows, typography } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useColors } from '../store/themeStore';
import { authAPI, commonAPI, API_BASE_URL } from '../api/client';

export default function LoginScreen() {
    const colors = useColors();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [companyName, setCompanyName] = useState('AttendX');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [offlineAvailable, setOfflineAvailable] = useState(false);
    const isSubmittingRef = useRef(false);

    const { login, loginOffline, checkOfflineLoginAvailable } = useAuthStore();

    // Check network status and offline availability
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? true);
        });

        // Check if offline login is available
        checkOfflineLoginAvailable().then(setOfflineAvailable);

        return () => unsubscribe();
    }, []);

    // Fetch company settings (when online)
    useEffect(() => {
        if (isOnline) {
            commonAPI.getSettings()
                .then(res => {
                    const s = res.data;
                    if (s.company_name) setCompanyName(s.company_name);
                    if (s.company_logo) setCompanyLogo(s.company_logo);
                })
                .catch(console.error);
        }
    }, [isOnline]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Email dan password harus diisi');
            return;
        }
        if (isLoading || isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setIsLoading(true);

        try {
            // Check current network status
            const networkState = await NetInfo.fetch();
            const currentlyOnline = networkState.isConnected;

            if (currentlyOnline) {
                // ONLINE LOGIN
                console.log('📱 Attempting online login...');
                const response = await authAPI.login({ email, password });
                const { user, access_token, refresh_token } = response.data;
                console.log('✅ Login successful');
                // Map avatar_url to photo if present
                const userWithPhoto = { ...user, photo: user.photo || user.avatar_url };
                login(userWithPhoto, access_token, refresh_token, password); // Pass password for caching
            } else {
                // OFFLINE LOGIN
                console.log('📴 Attempting offline login...');

                if (!offlineAvailable) {
                    Alert.alert(
                        'Tidak Tersedia',
                        'Login offline tidak tersedia. Anda perlu login online terlebih dahulu.'
                    );
                    return;
                }

                const success = await loginOffline(email, password);

                if (success) {
                    console.log('✅ Offline login successful');
                    Alert.alert(
                        'Mode Offline',
                        'Anda login dalam mode offline. Beberapa fitur mungkin terbatas.',
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert('Error', 'Email atau password salah (offline)');
                }
            }
        } catch (error: any) {
            console.log('❌ Login failed:', error.response?.data?.error || error.message);

            // If network error, try offline login
            if (error.message?.includes('Network') || !error.response) {
                console.log('📴 Network error, trying offline login...');

                if (offlineAvailable) {
                    const success = await loginOffline(email, password);

                    if (success) {
                        console.log('✅ Offline login successful (fallback)');
                        Alert.alert(
                            'Mode Offline',
                            'Server tidak dapat dijangkau. Anda login dalam mode offline.',
                            [{ text: 'OK' }]
                        );
                        return;
                    }
                }

                Alert.alert('Error', 'Tidak dapat terhubung ke server dan login offline gagal');
            } else {
                const message = error.response?.data?.error || 'Login gagal';
                Alert.alert('Error', message);
            }
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
    };

    const styles = createStyles(colors);

    return (
        <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.content}>
                {/* Offline Status Banner */}
                {!isOnline && (
                    <View style={[styles.offlineBanner, { backgroundColor: colors.warning }]}>
                        <Text style={styles.offlineBannerText}>
                            📴 Mode Offline {offlineAvailable ? '(Login tersedia)' : '(Login tidak tersedia)'}
                        </Text>
                    </View>
                )}

                <View style={styles.logoContainer}>
                    {companyLogo ? (
                        <Image
                            source={{ uri: `${API_BASE_URL}${companyLogo}` }}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={[styles.logo, { backgroundColor: colors.accent }]}><Text style={styles.logoText}>⏰</Text></View>
                    )}
                    <Text style={[styles.appName, { color: colors.textPrimary }]}>{companyName}</Text>
                    <Text style={[styles.tagline, { color: colors.textMuted }]}>Sistem Presensi Karyawan</Text>
                </View>

                <View style={[styles.form, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Masuk</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.textPrimary }]}
                            placeholder="email@perusahaan.com"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
                        <View style={[styles.passwordContainer, { backgroundColor: colors.surfaceLight }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.textPrimary }]}
                                placeholder="••••••••"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: isOnline ? colors.accent : colors.warning },
                            isLoading && styles.buttonDisabled
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading || (!isOnline && !offlineAvailable)}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.primary }]}>
                                {isOnline ? 'Masuk' : 'Masuk (Offline)'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Offline info */}
                    {!isOnline && offlineAvailable && (
                        <Text style={[styles.offlineInfo, { color: colors.textMuted }]}>
                            Gunakan email & password yang sama dengan login terakhir
                        </Text>
                    )}
                </View>

                <Text style={[styles.footer, { color: colors.textMuted }]}>v1.0.0 • @by roesch</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
    offlineBanner: {
        position: 'absolute',
        top: 50,
        left: spacing.xl,
        right: spacing.xl,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        zIndex: 10,
    },
    offlineBannerText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12
    },
    logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
    logo: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, ...shadows.glow },
    logoImage: { width: 100, height: 100, marginBottom: spacing.md },
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
    offlineInfo: {
        ...typography.caption,
        textAlign: 'center',
        marginTop: spacing.md,
        fontStyle: 'italic',
    },
    footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.xxl },
});
