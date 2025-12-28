// FaceVerificationFallback Component
// Fallback camera component for Expo Go (when VisionCamera is not available)
// Uses expo-camera with pseudo-embedding

import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
    extractEmbedding,
    compareEmbeddings
} from '../services/FaceEmbeddingService';

interface FaceVerificationFallbackProps {
    storedEmbeddings: number[][];
    onVerificationResult: (result: {
        isMatch: boolean;
        confidence: number;
        embedding?: number[];
    }) => void;
    onError?: (error: string) => void;
    style?: object;
}

export function FaceVerificationFallback({
    storedEmbeddings,
    onVerificationResult,
    onError,
    style,
}: FaceVerificationFallbackProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    const handleCapture = useCallback(async () => {
        if (!cameraRef.current || isProcessing) return;

        setIsProcessing(true);
        try {
            // Take photo
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            if (!photo?.uri) {
                throw new Error('Failed to capture photo');
            }

            // Extract embedding (will use pseudo-embedding in Expo Go)
            const embedding = await extractEmbedding(photo.uri);

            if (!embedding) {
                throw new Error('Failed to extract embedding');
            }

            // Compare with stored embeddings
            const result = compareEmbeddings(embedding, storedEmbeddings);

            onVerificationResult({
                isMatch: result.isMatch,
                confidence: result.confidence,
                embedding,
            });

        } catch (error) {
            console.error('[FaceVerifyFallback] Error:', error);
            onError?.(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsProcessing(false);
        }
    }, [storedEmbeddings, onVerificationResult, onError, isProcessing]);

    if (!permission) {
        return (
            <View style={[styles.container, styles.centered, style]}>
                <ActivityIndicator size="large" color="#06B6D4" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered, style]}>
                <Text style={styles.errorText}>Izin kamera diperlukan</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Izinkan Kamera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="front"
            />

            {/* Face guide overlay */}
            <View style={styles.overlay}>
                <View style={styles.faceGuide}>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                </View>

                <Text style={styles.guideText}>Posisikan wajah dalam bingkai</Text>
                <Text style={styles.warningText}>⚠️ Mode Expo Go (pseudo-verification)</Text>
            </View>

            {/* Capture button */}
            <View style={styles.captureContainer}>
                <TouchableOpacity
                    style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <View style={styles.captureInner} />
                    )}
                </TouchableOpacity>
                <Text style={styles.captureHint}>Ketuk untuk verifikasi</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceGuide: {
        width: 200,
        height: 260,
        borderRadius: 100,
        position: 'relative',
    },
    cornerTL: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderColor: '#06B6D4',
        borderTopLeftRadius: 80,
    },
    cornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderColor: '#06B6D4',
        borderTopRightRadius: 80,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderColor: '#06B6D4',
        borderBottomLeftRadius: 80,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderColor: '#06B6D4',
        borderBottomRightRadius: 80,
    },
    guideText: {
        marginTop: 20,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    warningText: {
        marginTop: 8,
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: '500',
    },
    captureContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(6, 182, 212, 0.3)',
        borderWidth: 4,
        borderColor: '#06B6D4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#06B6D4',
    },
    captureHint: {
        marginTop: 12,
        color: '#94A3B8',
        fontSize: 12,
    },
    button: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#06B6D4',
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FaceVerificationFallback;
