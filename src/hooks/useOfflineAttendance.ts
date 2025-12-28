// useOfflineAttendance Hook
// Handles attendance logic with offline fallback
import { useState, useCallback, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../store/authStore';
import { attendanceAPI } from '../api/client';
import {
    getCachedEmbeddings,
    queueAttendance,
    getPendingAttendance,
    removePendingAttendance,
    updateLastSync,
    PendingAttendance,
} from '../services/OfflineService';
import {
    compareEmbeddings,
    extractEmbedding,
} from '../services/FaceEmbeddingService';
import * as Device from 'expo-device';

interface OfflineCheckResult {
    success: boolean;
    isOffline: boolean;
    message: string;
}

export function useOfflineAttendance() {
    const user = useAuthStore((state) => state.user);
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Monitor network state
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: { isConnected: boolean | null }) => {
            setIsOnline(state.isConnected ?? true);
        });
        return () => unsubscribe();
    }, []);

    // Load pending count
    useEffect(() => {
        getPendingAttendance().then((p) => setPendingCount(p.length));
    }, []);

    /**
     * Perform local face verification using cached embeddings
     */
    const verifyFaceLocally = useCallback(async (photoUri: string): Promise<boolean> => {
        const cached = await getCachedEmbeddings();
        if (!cached || cached.embeddings.length === 0) {
            console.log('[Offline] No cached embeddings available');
            return false;
        }

        // Extract embedding from captured photo
        const testEmbedding = await extractEmbedding(photoUri);
        if (!testEmbedding) {
            console.log('[Offline] Failed to extract embedding');
            return false;
        }

        // Compare with cached embeddings
        const result = compareEmbeddings(testEmbedding, cached.embeddings);
        console.log('[Offline] Face comparison result:', result);

        return result.isMatch;
    }, []);

    /**
     * Check-in with offline fallback
     */
    const checkIn = useCallback(async (
        latitude: number,
        longitude: number,
        isMockLocation: boolean,
        photoUri?: string, // Optional for offline face verification
    ): Promise<OfflineCheckResult> => {
        if (!user) {
            return { success: false, isOffline: false, message: 'User not logged in' };
        }

        const deviceInfo = `${Device.brand} ${Device.modelName}`;

        // Try online first
        if (isOnline) {
            try {
                const response = await attendanceAPI.checkIn({
                    latitude,
                    longitude,
                    device_info: deviceInfo,
                    is_mock_location: isMockLocation,
                });
                return {
                    success: true,
                    isOffline: false,
                    message: response.data?.message || 'Check-in berhasil',
                };
            } catch (error: any) {
                // If network error, fall through to offline
                if (error.code === 'ECONNABORTED' || error.message?.includes('Network')) {
                    console.log('[Offline] Network error, falling back to offline mode');
                } else {
                    // Server rejected (e.g., already checked in, outside radius)
                    return {
                        success: false,
                        isOffline: false,
                        message: error.response?.data?.error || 'Check-in gagal',
                    };
                }
            }
        }

        // OFFLINE MODE
        console.log('[Offline] Processing check-in in offline mode');

        // Optional: Verify face locally if photo provided
        if (photoUri) {
            const isMatch = await verifyFaceLocally(photoUri);
            if (!isMatch) {
                return {
                    success: false,
                    isOffline: true,
                    message: 'Verifikasi wajah gagal (offline)',
                };
            }
        }

        // Queue the attendance record
        await queueAttendance({
            userId: user.id,
            employeeId: user.employee_id,
            type: 'check-in',
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            deviceInfo,
            isMockLocation,
        });

        const pending = await getPendingAttendance();
        setPendingCount(pending.length);

        return {
            success: true,
            isOffline: true,
            message: 'Check-in tersimpan (akan disinkronkan saat online)',
        };
    }, [user, isOnline, verifyFaceLocally]);

    /**
     * Check-out with offline fallback
     */
    const checkOut = useCallback(async (
        latitude: number,
        longitude: number,
    ): Promise<OfflineCheckResult> => {
        if (!user) {
            return { success: false, isOffline: false, message: 'User not logged in' };
        }

        const deviceInfo = `${Device.brand} ${Device.modelName}`;

        // Try online first
        if (isOnline) {
            try {
                const response = await attendanceAPI.checkOut({
                    latitude,
                    longitude,
                    device_info: deviceInfo,
                });
                return {
                    success: true,
                    isOffline: false,
                    message: response.data?.message || 'Check-out berhasil',
                };
            } catch (error: any) {
                if (error.code === 'ECONNABORTED' || error.message?.includes('Network')) {
                    console.log('[Offline] Network error, falling back to offline mode');
                } else {
                    return {
                        success: false,
                        isOffline: false,
                        message: error.response?.data?.error || 'Check-out gagal',
                    };
                }
            }
        }

        // OFFLINE MODE
        await queueAttendance({
            userId: user.id,
            employeeId: user.employee_id,
            type: 'check-out',
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            deviceInfo,
            isMockLocation: false,
        });

        const pending = await getPendingAttendance();
        setPendingCount(pending.length);

        return {
            success: true,
            isOffline: true,
            message: 'Check-out tersimpan (akan disinkronkan saat online)',
        };
    }, [user, isOnline]);

    /**
     * Sync pending attendance records to server
     */
    const syncPendingAttendance = useCallback(async (): Promise<{ synced: number; failed: number }> => {
        if (!isOnline) {
            return { synced: 0, failed: 0 };
        }

        setIsSyncing(true);
        const pending = await getPendingAttendance();
        let synced = 0;
        let failed = 0;

        for (const record of pending) {
            try {
                // TODO: Replace with batch sync endpoint when available
                if (record.type === 'check-in') {
                    await attendanceAPI.checkIn({
                        latitude: record.latitude,
                        longitude: record.longitude,
                        device_info: record.deviceInfo,
                        is_mock_location: record.isMockLocation,
                    });
                } else {
                    await attendanceAPI.checkOut({
                        latitude: record.latitude,
                        longitude: record.longitude,
                        device_info: record.deviceInfo,
                    });
                }
                await removePendingAttendance(record.id);
                synced++;
            } catch (error) {
                console.warn('[Offline] Failed to sync record:', record.id, error);
                failed++;
            }
        }

        if (synced > 0) {
            await updateLastSync();
        }

        const remaining = await getPendingAttendance();
        setPendingCount(remaining.length);
        setIsSyncing(false);

        return { synced, failed };
    }, [isOnline]);

    return {
        isOnline,
        isSyncing,
        pendingCount,
        checkIn,
        checkOut,
        syncPendingAttendance,
        verifyFaceLocally,
    };
}
