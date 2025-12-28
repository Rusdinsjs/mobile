// Check-In Screen with Face Verification and Offline Support
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, shadows, typography } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useColors } from '../store/themeStore';
import { useLocation } from '../hooks/useLocation';
import { useOfflineAttendance } from '../hooks/useOfflineAttendance';
import { isWithinRadius, formatDistance, calculateDistance } from '../utils/geofence';
import { FaceVerification } from '../components/FaceVerification';

interface CheckInScreenProps { navigation: any; }

type ScreenMode = 'loading' | 'verify' | 'processing' | 'success' | 'error';

export default function CheckInScreen({ navigation }: CheckInScreenProps) {
    const colors = useColors();
    const [mode, setMode] = useState<ScreenMode>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    const user = useAuthStore((state) => state.user);
    const { isCheckedIn, checkIn, checkOut } = useAttendanceStore();
    const { latitude, longitude, isMockLocation } = useLocation();
    const { isOnline, checkIn: offlineCheckIn, checkOut: offlineCheckOut } = useOfflineAttendance();

    // Auto-start verification when location is ready
    React.useEffect(() => {
        if (mode === 'loading' && user && latitude && longitude) {
            // Check if within radius
            const withinRadius = isWithinRadius(
                user.office_lat,
                user.office_long,
                latitude,
                longitude,
                user.allowed_radius
            );

            if (!withinRadius) {
                const dist = calculateDistance(user.office_lat, user.office_long, latitude, longitude);
                setErrorMessage(`Anda berada ${formatDistance(dist)} dari kantor. Maksimal ${user.allowed_radius}m.`);
                setMode('error');
                return;
            }

            if (isMockLocation) {
                setErrorMessage('Fake GPS terdeteksi. Check-in tidak diizinkan.');
                setMode('error');
                return;
            }

            // Location valid, proceed to face verification
            setMode('verify');
        }
    }, [latitude, longitude, user, mode]);

    // Handle face verification result
    const handleVerificationResult = useCallback(async (result: {
        isMatch: boolean;
        confidence: number;
        embedding?: number[];
    }) => {
        console.log('[CheckIn] Verification result:', result);

        if (!result.isMatch) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage(`Wajah tidak cocok (${Math.round(result.confidence * 100)}% confidence)`);
            setMode('error');
            return;
        }

        // Face verified, proceed with check-in/out
        setMode('processing');

        try {
            const action = isCheckedIn ? 'Check Out' : 'Check In';

            if (isCheckedIn) {
                // Check-out
                const checkOutResult = await offlineCheckOut(latitude!, longitude!);

                if (checkOutResult.success) {
                    checkOut({ check_out_time: new Date().toISOString() } as any);
                    setSuccessMessage(checkOutResult.isOffline
                        ? 'Check Out tersimpan (offline)'
                        : 'Check Out berhasil!');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setMode('success');
                    setTimeout(() => navigation.goBack(), 2000);
                } else {
                    throw new Error(checkOutResult.message);
                }
            } else {
                // Check-in
                const checkInResult = await offlineCheckIn(
                    latitude!,
                    longitude!,
                    isMockLocation,
                    undefined // photo uri for offline verification (already verified above)
                );

                if (checkInResult.success) {
                    checkIn({ check_in_time: new Date().toISOString() } as any);
                    setSuccessMessage(checkInResult.isOffline
                        ? 'Check In tersimpan (offline)'
                        : 'Check In berhasil!');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setMode('success');
                    setTimeout(() => navigation.goBack(), 2000);
                } else {
                    throw new Error(checkInResult.message);
                }
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage(error.message || 'Operasi gagal');
            setMode('error');
        }
    }, [isCheckedIn, latitude, longitude, isMockLocation, offlineCheckIn, offlineCheckOut, checkIn, checkOut, navigation]);

    const handleRetry = () => {
        setErrorMessage('');
        setMode('loading');
    };

    const styles = createStyles(colors);

    // Loading state - waiting for location
    if (mode === 'loading') {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.statusText, { color: colors.textMuted }]}>
                    Mencari lokasi...
                </Text>
                <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.surfaceLight }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Face verification mode
    if (mode === 'verify') {
        const storedEmbeddings = user?.face_embeddings || [];

        if (storedEmbeddings.length === 0) {
            return (
                <View style={[styles.container, styles.centered]}>
                    <View style={[styles.errorIcon, { backgroundColor: colors.warning }]}>
                        <Text style={styles.errorEmoji}>⚠️</Text>
                    </View>
                    <Text style={[styles.errorTitle, { color: colors.warning }]}>
                        Wajah Belum Terdaftar
                    </Text>
                    <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>
                        Silakan daftarkan wajah Anda terlebih dahulu di menu Profil.
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.warning }]}
                        onPress={() => navigation.navigate('FaceRegistration')}
                    >
                        <Text style={styles.retryButtonText}>Daftar Wajah</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.surfaceLight, marginTop: spacing.sm }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                {/* Header info */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <View style={styles.headerRow}>
                        <View style={[styles.badge, { backgroundColor: isOnline ? colors.success : colors.warning }]}>
                            <Text style={styles.badgeText}>{isOnline ? '🌐 Online' : '📴 Offline'}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.surfaceLight }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                                {isCheckedIn ? '🚪 Check Out' : '📍 Check In'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.headerTime, { color: colors.accent }]}>
                        {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {/* Face verification camera */}
                <FaceVerification
                    storedEmbeddings={storedEmbeddings}
                    onVerificationResult={handleVerificationResult}
                    onError={(error) => {
                        setErrorMessage(error);
                        setMode('error');
                    }}
                    style={{ flex: 1 }}
                />

                {/* Cancel button overlay */}
                <TouchableOpacity
                    style={styles.floatingCancel}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.floatingCancelText}>✕</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Processing state
    if (mode === 'processing') {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.statusText, { color: colors.textMuted }]}>
                    {isCheckedIn ? 'Memproses Check Out...' : 'Memproses Check In...'}
                </Text>
            </View>
        );
    }

    // Success state
    if (mode === 'success') {
        return (
            <View style={[styles.container, styles.centered]}>
                <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                    <Text style={styles.successEmoji}>✓</Text>
                </View>
                <Text style={[styles.successTitle, { color: colors.success }]}>
                    {successMessage}
                </Text>
                <Text style={[styles.successTime, { color: colors.accent }]}>
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
            </View>
        );
    }

    // Error state
    if (mode === 'error') {
        return (
            <View style={[styles.container, styles.centered]}>
                <View style={[styles.errorIcon, { backgroundColor: colors.error }]}>
                    <Text style={styles.errorEmoji}>✕</Text>
                </View>
                <Text style={[styles.errorTitle, { color: colors.error }]}>
                    Gagal
                </Text>
                <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>
                    {errorMessage}
                </Text>
                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: colors.accent }]}
                    onPress={handleRetry}
                >
                    <Text style={styles.retryButtonText}>Coba Lagi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.surfaceLight, marginTop: spacing.sm }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    statusText: {
        ...typography.body,
        marginTop: spacing.lg,
    },
    header: {
        padding: spacing.md,
        paddingTop: spacing.lg,
        alignItems: 'center',
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
    },
    headerRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    headerTime: {
        ...typography.clock,
    },
    floatingCancel: {
        position: 'absolute',
        top: spacing.lg,
        right: spacing.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingCancelText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    successEmoji: {
        fontSize: 48,
        color: '#fff',
    },
    successTitle: {
        ...typography.h1,
        marginBottom: spacing.sm,
    },
    successTime: {
        ...typography.h2,
    },
    errorIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    errorEmoji: {
        fontSize: 48,
        color: '#fff',
    },
    errorTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
    },
    errorSubtitle: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    retryButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
    },
    retryButtonText: {
        ...typography.body,
        fontWeight: '700',
        color: '#fff',
    },
    cancelButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginTop: spacing.lg,
    },
    cancelButtonText: {
        ...typography.body,
    },
});
