// Check-In Screen with Dynamic Theming
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, shadows, typography } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useColors } from '../store/themeStore';
import { attendanceAPI } from '../api/client';
import { useLocation } from '../hooks/useLocation';
import { isWithinRadius, formatDistance, calculateDistance } from '../utils/geofence';
import FaceCamera from '../components/FaceCamera';

interface CheckInScreenProps { navigation: any; }

type ScreenMode = 'confirm' | 'camera' | 'success';

export default function CheckInScreen({ navigation }: CheckInScreenProps) {
    const colors = useColors();
    const [mode, setMode] = useState<ScreenMode>('confirm');
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

    const user = useAuthStore((state) => state.user);
    const { isCheckedIn, checkIn, checkOut } = useAttendanceStore();
    const { latitude, longitude, isMockLocation } = useLocation();

    const validateLocation = (): boolean => {
        if (!user || !latitude || !longitude) { Alert.alert('Error', 'Lokasi tidak tersedia.'); return false; }
        const withinRadius = isWithinRadius(user.office_lat, user.office_long, latitude, longitude, user.allowed_radius);
        if (!withinRadius) {
            const dist = calculateDistance(user.office_lat, user.office_long, latitude, longitude);
            Alert.alert('Di Luar Jangkauan', `Anda berada ${formatDistance(dist)} dari kantor.`);
            return false;
        }
        if (isMockLocation) { Alert.alert('Peringatan', 'Fake GPS terdeteksi.'); return false; }
        return true;
    };

    const handleStartCapture = () => { if (validateLocation()) setMode('camera'); };
    const handlePhotoCapture = (photoUri: string) => { setCapturedPhoto(photoUri); performCheckInOut(photoUri); };
    const handleSkipFace = () => { performCheckInOut(null); };

    const performCheckInOut = async (photoUri: string | null) => {
        if (!validateLocation()) return;
        setIsProcessing(true);
        setMode('confirm');
        try {
            const deviceInfo = `Mobile App - ${new Date().toISOString()}`;
            if (isCheckedIn) {
                const response = await attendanceAPI.checkOut({ latitude: latitude!, longitude: longitude!, device_info: deviceInfo });
                checkOut(response.data.attendance);
            } else {
                const response = await attendanceAPI.checkIn({ latitude: latitude!, longitude: longitude!, device_info: deviceInfo, is_mock_location: isMockLocation });
                checkIn(response.data.attendance);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMode('success');
            setTimeout(() => navigation.goBack(), 1500);
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.response?.data?.error || 'Operasi gagal');
        } finally {
            setIsProcessing(false);
        }
    };

    const styles = createStyles(colors);

    if (mode === 'success') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.successContainer}>
                    {capturedPhoto && <Image source={{ uri: capturedPhoto }} style={styles.capturedPhoto} />}
                    <View style={[styles.successIcon, { backgroundColor: colors.success }]}><Text style={styles.successEmoji}>✓</Text></View>
                    <Text style={[styles.successText, { color: colors.success }]}>{isCheckedIn ? 'Check Out Berhasil!' : 'Check In Berhasil!'}</Text>
                </View>
            </View>
        );
    }

    if (mode === 'camera') {
        return <FaceCamera onCapture={handlePhotoCapture} onCancel={handleSkipFace} isLoading={isProcessing} />;
    }

    const distance = user && latitude && longitude ? calculateDistance(user.office_lat, user.office_long, latitude, longitude) : null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.previewCard}>
                <View style={[styles.previewIcon, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
                    <Text style={styles.previewEmoji}>{isCheckedIn ? '🚪' : '📍'}</Text>
                </View>
                <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>{isCheckedIn ? 'Check Out' : 'Check In'}</Text>
                <Text style={[styles.previewTime, { color: colors.accent }]}>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <View style={styles.infoGrid}>
                    <View style={[styles.infoItem, { backgroundColor: colors.surfaceLight }]}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>GPS</Text>
                        <Text style={[styles.infoValue, { color: isMockLocation ? colors.error : colors.success }]}>{isMockLocation ? 'Mock ⚠️' : 'Valid ✓'}</Text>
                    </View>
                    <View style={[styles.infoItem, { backgroundColor: colors.surfaceLight }]}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Jarak</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{distance !== null ? formatDistance(distance) : '-'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.faceButton, { backgroundColor: colors.surface, borderColor: colors.accent + '50' }]} onPress={handleStartCapture} disabled={isProcessing}>
                    <Text style={styles.faceIcon}>📷</Text>
                    <Text style={[styles.faceButtonText, { color: colors.accent }]}>Verifikasi dengan Wajah</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.accent }, isProcessing && styles.buttonDisabled]} onPress={handleSkipFace} disabled={isProcessing}>
                    {isProcessing ? <ActivityIndicator color={colors.primary} /> : (
                        <>
                            <Text style={styles.confirmIcon}>{isCheckedIn ? '🚪' : '✓'}</Text>
                            <Text style={[styles.confirmButtonText, { color: colors.primary }]}>{isCheckedIn ? 'Check Out' : 'Check In'} Langsung</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]} onPress={() => navigation.goBack()} disabled={isProcessing}>
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    previewCard: { alignItems: 'center', padding: spacing.xxl, paddingTop: spacing.xxl + 20 },
    previewIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, borderWidth: 2 },
    previewEmoji: { fontSize: 36 },
    previewTitle: { ...typography.h2 },
    previewTime: { ...typography.clock, marginTop: spacing.sm },
    infoCard: { borderRadius: borderRadius.lg, padding: spacing.lg, marginHorizontal: spacing.lg, marginBottom: spacing.lg },
    infoGrid: { flexDirection: 'row', gap: spacing.md },
    infoItem: { flex: 1, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
    infoLabel: { ...typography.caption, marginBottom: 4 },
    infoValue: { ...typography.body, fontWeight: '600' },
    buttonContainer: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
    faceButton: { flexDirection: 'row', borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1 },
    faceIcon: { fontSize: 18 },
    faceButtonText: { ...typography.body, fontWeight: '600' },
    confirmButton: { flexDirection: 'row', borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, ...shadows.glow },
    buttonDisabled: { opacity: 0.7 },
    confirmIcon: { fontSize: 18 },
    confirmButtonText: { ...typography.h3, fontWeight: '700' },
    cancelButton: { borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1 },
    cancelButtonText: { ...typography.body },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    capturedPhoto: { width: 100, height: 120, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
    successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
    successEmoji: { fontSize: 36, color: '#fff' },
    successText: { ...typography.h2 },
});
