// FaceVerification - Smart Component
// Automatically chooses between VisionCamera (Dev Build) and Expo Camera (Expo Go)

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { isTFLiteAvailable, isVisionCameraAvailable } from '../services/FaceEmbeddingService';

// Lazy imports to prevent crashes in Expo Go
let FaceVerificationCamera: React.ComponentType<any> | null = null;
let FaceVerificationFallback: React.ComponentType<any> | null = null;

interface FaceVerificationProps {
    storedEmbeddings: number[][];
    onVerificationResult: (result: {
        isMatch: boolean;
        confidence: number;
        embedding?: number[];
    }) => void;
    onError?: (error: string) => void;
    style?: object;
}

export function FaceVerification(props: FaceVerificationProps) {
    const [isReady, setIsReady] = useState(false);
    const [useNative, setUseNative] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function checkCapabilities() {
            try {
                const tfliteAvailable = isTFLiteAvailable();
                const visionCameraAvailable = isVisionCameraAvailable();

                console.log('[FaceVerification] TFLite available:', tfliteAvailable);
                console.log('[FaceVerification] VisionCamera available:', visionCameraAvailable);

                if (tfliteAvailable && visionCameraAvailable) {
                    // Use native components (Development Build)
                    const native = await import('./FaceVerificationCamera');
                    FaceVerificationCamera = native.FaceVerificationCamera;
                    setUseNative(true);
                } else {
                    // Use fallback (Expo Go)
                    const fallback = await import('./FaceVerificationFallback');
                    FaceVerificationFallback = fallback.FaceVerificationFallback;
                    setUseNative(false);
                }

                setIsReady(true);
            } catch (err) {
                console.error('[FaceVerification] Setup error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');

                // Try fallback
                try {
                    const fallback = await import('./FaceVerificationFallback');
                    FaceVerificationFallback = fallback.FaceVerificationFallback;
                    setUseNative(false);
                    setIsReady(true);
                    setError(null);
                } catch {
                    // Complete failure
                }
            }
        }

        checkCapabilities();
    }, []);

    if (error) {
        return (
            <View style={[styles.container, styles.centered, props.style]}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    if (!isReady) {
        return (
            <View style={[styles.container, styles.centered, props.style]}>
                <ActivityIndicator size="large" color="#06B6D4" />
                <Text style={styles.loadingText}>Mempersiapkan kamera...</Text>
            </View>
        );
    }

    if (useNative && FaceVerificationCamera) {
        return <FaceVerificationCamera {...props} />;
    }

    if (FaceVerificationFallback) {
        return <FaceVerificationFallback {...props} />;
    }

    return (
        <View style={[styles.container, styles.centered, props.style]}>
            <Text style={styles.errorText}>Kamera tidak tersedia</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#06B6D4',
        fontSize: 14,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default FaceVerification;
