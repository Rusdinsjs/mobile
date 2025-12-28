// Offline Storage Service
// Handles local persistence of face embeddings and pending attendance records
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    FACE_EMBEDDINGS: '@offline_face_embeddings',
    PENDING_ATTENDANCE: '@offline_pending_attendance',
    LAST_SYNC: '@offline_last_sync',
};

export interface PendingAttendance {
    id: string;
    userId: string;
    employeeId: string;
    type: 'check-in' | 'check-out';
    latitude: number;
    longitude: number;
    timestamp: string;
    deviceInfo: string;
    isMockLocation: boolean;
    createdAt: string;
}

// ============ Face Embeddings ============

/**
 * Cache face embeddings for offline verification
 */
export async function cacheFaceEmbeddings(userId: string, embeddings: number[][]): Promise<void> {
    try {
        const data = { userId, embeddings, cachedAt: new Date().toISOString() };
        await AsyncStorage.setItem(KEYS.FACE_EMBEDDINGS, JSON.stringify(data));
        console.log('[Offline] Face embeddings cached for user:', userId);
    } catch (error) {
        console.error('[Offline] Failed to cache embeddings:', error);
    }
}

/**
 * Get cached face embeddings
 */
export async function getCachedEmbeddings(): Promise<{ userId: string; embeddings: number[][] } | null> {
    try {
        const data = await AsyncStorage.getItem(KEYS.FACE_EMBEDDINGS);
        if (!data) return null;
        return JSON.parse(data);
    } catch (error) {
        console.error('[Offline] Failed to get cached embeddings:', error);
        return null;
    }
}

/**
 * Clear cached embeddings (on logout)
 */
export async function clearCachedEmbeddings(): Promise<void> {
    try {
        await AsyncStorage.removeItem(KEYS.FACE_EMBEDDINGS);
        console.log('[Offline] Cached embeddings cleared');
    } catch (error) {
        console.error('[Offline] Failed to clear embeddings:', error);
    }
}

// ============ Pending Attendance Queue ============

/**
 * Add attendance record to offline queue
 */
export async function queueAttendance(record: Omit<PendingAttendance, 'id' | 'createdAt'>): Promise<void> {
    try {
        const existing = await getPendingAttendance();
        const newRecord: PendingAttendance = {
            ...record,
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
        };
        existing.push(newRecord);
        await AsyncStorage.setItem(KEYS.PENDING_ATTENDANCE, JSON.stringify(existing));
        console.log('[Offline] Attendance queued:', newRecord.id);
    } catch (error) {
        console.error('[Offline] Failed to queue attendance:', error);
        throw error;
    }
}

/**
 * Get all pending attendance records
 */
export async function getPendingAttendance(): Promise<PendingAttendance[]> {
    try {
        const data = await AsyncStorage.getItem(KEYS.PENDING_ATTENDANCE);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('[Offline] Failed to get pending attendance:', error);
        return [];
    }
}

/**
 * Remove specific attendance record after successful sync
 */
export async function removePendingAttendance(id: string): Promise<void> {
    try {
        const existing = await getPendingAttendance();
        const filtered = existing.filter((r) => r.id !== id);
        await AsyncStorage.setItem(KEYS.PENDING_ATTENDANCE, JSON.stringify(filtered));
    } catch (error) {
        console.error('[Offline] Failed to remove attendance:', error);
    }
}

/**
 * Clear all pending attendance (after batch sync)
 */
export async function clearPendingAttendance(): Promise<void> {
    try {
        await AsyncStorage.removeItem(KEYS.PENDING_ATTENDANCE);
        console.log('[Offline] Pending attendance cleared');
    } catch (error) {
        console.error('[Offline] Failed to clear pending attendance:', error);
    }
}

// ============ Sync Status ============

/**
 * Update last sync timestamp
 */
export async function updateLastSync(): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
}

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LAST_SYNC);
}

/**
 * Check if we have pending records to sync
 */
export async function hasPendingSync(): Promise<boolean> {
    const pending = await getPendingAttendance();
    return pending.length > 0;
}
