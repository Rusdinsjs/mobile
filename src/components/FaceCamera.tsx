// Face Camera with Dynamic Theming
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useColors } from '../store/themeStore';

interface FaceCameraProps {
    onCapture: (photoUri: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function FaceCamera({ onCapture, onCancel, isLoading }: FaceCameraProps) {
    const colors = useColors();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing] = useState<CameraType>('front');
    const [isReady, setIsReady] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => { if (!permission?.granted) requestPermission(); }, [permission]);

    const handleCapture = async () => {
        if (cameraRef.current && isReady) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
                if (photo?.uri) onCapture(photo.uri);
            } catch (error) { console.error('Failed to capture:', error); }
        }
    };

    const styles = createStyles(colors);

    if (!permission) {
        return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /><Text style={[styles.statusText, { color: colors.textMuted }]}>Memuat kamera...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Text style={styles.icon}>📷</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Izin Kamera Diperlukan</Text>
                <Text style={[styles.description, { color: colors.textMuted }]}>Aplikasi memerlukan akses kamera untuk verifikasi wajah</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={requestPermission}><Text style={[styles.buttonText, { color: colors.primary }]}>Izinkan Kamera</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}><Text style={[styles.cancelText, { color: colors.textSecondary }]}>Batal</Text></TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.cameraContainer}>
                <CameraView ref={cameraRef} style={styles.camera} facing={facing} onCameraReady={() => setIsReady(true)} />
                {/* Overlay placed as sibling with absolute positioning */}
                <View style={styles.overlay}>
                    <View style={styles.faceGuide}>
                        <View style={[styles.corner, styles.topLeft, { borderColor: colors.accent }]} />
                        <View style={[styles.corner, styles.topRight, { borderColor: colors.accent }]} />
                        <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.accent }]} />
                        <View style={[styles.corner, styles.bottomRight, { borderColor: colors.accent }]} />
                    </View>
                    <Text style={styles.guideText}>Posisikan wajah dalam bingkai</Text>
                </View>
            </View>
            <View style={styles.controls}>
                <TouchableOpacity style={[styles.captureButton, { borderColor: colors.accent }, (isLoading || !isReady) && styles.disabled]} onPress={handleCapture} disabled={isLoading || !isReady}>
                    {isLoading ? <ActivityIndicator color={colors.primary} /> : <View style={[styles.captureInner, { backgroundColor: colors.accent }]} />}
                </TouchableOpacity>
                <Text style={[styles.captureHint, { color: colors.textMuted }]}>{isLoading ? 'Memproses...' : 'Tekan untuk mengambil foto'}</Text>
                <TouchableOpacity style={styles.skipButton} onPress={onCancel}><Text style={[styles.skipText, { color: colors.textSecondary }]}>Lewati Verifikasi Wajah</Text></TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    cameraContainer: { flex: 1, overflow: 'hidden', borderRadius: borderRadius.xl, margin: spacing.lg },
    camera: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    faceGuide: { width: 200, height: 250, position: 'relative' },
    corner: { position: 'absolute', width: 30, height: 30 },
    topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 20 },
    topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 20 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 20 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 20 },
    guideText: { ...typography.bodySmall, color: '#fff', textAlign: 'center', marginTop: 280, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    controls: { padding: spacing.xl, alignItems: 'center' },
    captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 4 },
    captureInner: { width: 56, height: 56, borderRadius: 28 },
    disabled: { opacity: 0.5 },
    captureHint: { ...typography.caption, marginTop: spacing.sm },
    skipButton: { marginTop: spacing.lg, padding: spacing.sm },
    skipText: { ...typography.bodySmall, textDecorationLine: 'underline' },
    icon: { fontSize: 64, marginBottom: spacing.lg },
    title: { ...typography.h3, marginBottom: spacing.sm },
    description: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.xl },
    statusText: { ...typography.bodySmall, marginTop: spacing.md },
    button: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
    buttonText: { ...typography.body, fontWeight: '600' },
    cancelButton: { padding: spacing.md },
    cancelText: { ...typography.body },
});
