// Face Registration Screen
// Guides user through capturing 5 face photos for improved recognition accuracy
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, typography, shadows } from '../styles/theme';
import { useColors } from '../store/themeStore';
import { useFaceStore } from '../store/faceStore';
import { useAuthStore } from '../store/authStore';
import { extractEmbedding, detectFaces } from '../services/FaceEmbeddingService';
import { userAPI } from '../api/client';

interface FaceRegistrationScreenProps {
    navigation: any;
}

const TOTAL_CAPTURES = 5;
const CAPTURE_TIPS = [
    'Hadapkan wajah lurus ke kamera 📷',
    'Miringkan kepala sedikit ke kiri ↖️',
    'Miringkan kepala sedikit ke kanan ↗️',
    'Angkat dagu sedikit ke atas ⬆️',
    'Turunkan dagu sedikit ke bawah ⬇️',
];

export default function FaceRegistrationScreen({ navigation }: FaceRegistrationScreenProps) {
    const colors = useColors();
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
    const [embeddings, setEmbeddings] = useState<number[][]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentTip, setCurrentTip] = useState(0);
    const [cameraReady, setCameraReady] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    const { setEmbeddings: setStoreEmbeddings, setLastSyncedAt } = useFaceStore();
    const { updateFaceEmbeddings } = useAuthStore();

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleCapture = async () => {
        if (!cameraRef.current || !cameraReady || isCapturing) return;

        setIsCapturing(true);

        try {
            // Take photo
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            if (!photo?.uri) {
                throw new Error('Failed to capture photo');
            }

            // Detect face
            const detection = await detectFaces(photo.uri);
            if (!detection.detected) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Wajah Tidak Terdeteksi', detection.error || 'Coba lagi');
                return;
            }

            // Extract embedding
            setIsProcessing(true);
            const embedding = await extractEmbedding(photo.uri);

            if (!embedding) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', 'Gagal memproses wajah. Coba lagi.');
                return;
            }

            // Success
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setCapturedPhotos((prev) => [...prev, photo.uri]);
            setEmbeddings((prev) => [...prev, embedding]);
            setCurrentTip((prev) => prev + 1);

        } catch (error) {
            console.error('Capture error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Gagal mengambil foto. Coba lagi.');
        } finally {
            setIsCapturing(false);
            setIsProcessing(false);
        }
    };

    const handleUpload = async () => {
        if (capturedPhotos.length < TOTAL_CAPTURES) {
            Alert.alert('Belum Lengkap', `Anda perlu mengambil ${TOTAL_CAPTURES} foto wajah.`);
            return;
        }

        setIsUploading(true);

        try {
            // Upload photos to server for admin verification
            await userAPI.uploadFacePhotos(capturedPhotos);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Foto Terkirim! 📤',
                'Foto wajah Anda telah dikirim dan menunggu verifikasi dari admin.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('Upload error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.response?.data?.error || 'Gagal mengunggah foto wajah.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = () => {
        Alert.alert(
            'Reset?',
            'Hapus semua foto yang sudah diambil?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        setCapturedPhotos([]);
                        setEmbeddings([]);
                        setCurrentTip(0);
                    },
                },
            ]
        );
    };

    const styles = createStyles(colors);

    // Permission not granted view
    if (!permission?.granted) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centered}>
                    <Text style={styles.icon}>📷</Text>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Izin Kamera Diperlukan
                    </Text>
                    <Text style={[styles.description, { color: colors.textMuted }]}>
                        Untuk mendaftarkan wajah, aplikasi memerlukan akses ke kamera.
                    </Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={requestPermission}
                    >
                        <Text style={[styles.buttonText, { color: colors.primary }]}>
                            Izinkan Kamera
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // All photos captured - show summary
    if (capturedPhotos.length >= TOTAL_CAPTURES) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView contentContainerStyle={styles.summaryContainer}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Registrasi Selesai! 🎉
                    </Text>
                    <Text style={[styles.description, { color: colors.textMuted }]}>
                        {TOTAL_CAPTURES} foto wajah telah berhasil diambil.
                    </Text>

                    <View style={styles.photoGrid}>
                        {capturedPhotos.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.thumbnail} />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: colors.accent }, isUploading && styles.disabled]}
                        onPress={handleUpload}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                                Simpan Data Wajah
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.resetButton, { borderColor: colors.surfaceLight }]}
                        onPress={handleReset}
                        disabled={isUploading}
                    >
                        <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
                            Ulangi Foto
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // Camera capture view
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Progress */}
            <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: colors.textMuted }]}>
                    Foto {capturedPhotos.length + 1} dari {TOTAL_CAPTURES}
                </Text>
                <View style={styles.progressBar}>
                    {Array.from({ length: TOTAL_CAPTURES }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.progressDot,
                                {
                                    backgroundColor:
                                        i < capturedPhotos.length
                                            ? colors.success
                                            : i === capturedPhotos.length
                                                ? colors.accent
                                                : colors.surfaceLight,
                                },
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Tip */}
            <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.tipEmoji}>💡</Text>
                <Text style={[styles.tipText, { color: colors.textPrimary }]}>
                    {CAPTURE_TIPS[currentTip] || CAPTURE_TIPS[0]}
                </Text>
            </View>

            {/* Camera */}
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                    onCameraReady={() => setCameraReady(true)}
                />
                {/* Overlay */}
                <View style={styles.overlay}>
                    <View style={styles.faceGuide}>
                        <View style={[styles.corner, styles.topLeft, { borderColor: colors.accent }]} />
                        <View style={[styles.corner, styles.topRight, { borderColor: colors.accent }]} />
                        <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.accent }]} />
                        <View style={[styles.corner, styles.bottomRight, { borderColor: colors.accent }]} />
                    </View>
                </View>
                {/* Processing overlay */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color={colors.accent} />
                        <Text style={styles.processingText}>Memproses...</Text>
                    </View>
                )}
            </View>

            {/* Thumbnails */}
            {capturedPhotos.length > 0 && (
                <View style={styles.thumbnailRow}>
                    {capturedPhotos.map((uri, index) => (
                        <Image key={index} source={{ uri }} style={styles.smallThumbnail} />
                    ))}
                </View>
            )}

            {/* Capture Button */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[
                        styles.captureButton,
                        { borderColor: colors.accent },
                        (isCapturing || isProcessing || !cameraReady) && styles.disabled,
                    ]}
                    onPress={handleCapture}
                    disabled={isCapturing || isProcessing || !cameraReady}
                >
                    {isCapturing ? (
                        <ActivityIndicator color={colors.accent} />
                    ) : (
                        <View style={[styles.captureInner, { backgroundColor: colors.accent }]} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (colors: any) =>
    StyleSheet.create({
        container: { flex: 1 },
        centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
        icon: { fontSize: 64, marginBottom: spacing.lg },
        title: { ...typography.h2, marginBottom: spacing.sm, textAlign: 'center' },
        description: { ...typography.body, textAlign: 'center', marginBottom: spacing.xl },
        button: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
        buttonText: { ...typography.body, fontWeight: '600' },

        progressContainer: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.md },
        progressText: { ...typography.caption, marginBottom: spacing.sm },
        progressBar: { flexDirection: 'row', gap: spacing.sm },
        progressDot: { width: 12, height: 12, borderRadius: 6 },

        tipCard: {
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: spacing.lg,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            gap: spacing.sm,
        },
        tipEmoji: { fontSize: 20 },
        tipText: { ...typography.body, flex: 1 },

        cameraContainer: {
            flex: 1,
            margin: spacing.lg,
            borderRadius: borderRadius.xl,
            overflow: 'hidden',
        },
        camera: { flex: 1 },
        overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
        faceGuide: { width: 220, height: 280, position: 'relative' },
        corner: { position: 'absolute', width: 40, height: 40 },
        topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 24 },
        topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 24 },
        bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 24 },
        bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 24 },

        processingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        processingText: { color: '#fff', marginTop: spacing.sm, ...typography.body },

        thumbnailRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
        smallThumbnail: { width: 48, height: 60, borderRadius: borderRadius.sm },

        controls: { alignItems: 'center', paddingBottom: spacing.xl },
        captureButton: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            ...shadows.md,
        },
        captureInner: { width: 56, height: 56, borderRadius: 28 },
        disabled: { opacity: 0.5 },
        cancelButton: { marginTop: spacing.md, padding: spacing.sm },
        cancelText: { ...typography.body },

        summaryContainer: { padding: spacing.xl, alignItems: 'center' },
        photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.xl },
        thumbnail: { width: 80, height: 100, borderRadius: borderRadius.md },

        uploadButton: {
            width: '100%',
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            marginBottom: spacing.md,
            ...shadows.glow,
        },
        uploadButtonText: { ...typography.h3, fontWeight: '700' },
        resetButton: {
            width: '100%',
            padding: spacing.md,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            borderWidth: 1,
        },
        resetButtonText: { ...typography.body },
    });
