// Offline Authentication Service
// Handles secure credential caching for offline login
// Uses expo-secure-store for encrypted storage and expo-crypto for password hashing

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
    CACHED_CREDENTIALS: 'offline_cached_credentials',
    CACHED_USER: 'offline_cached_user',
    LAST_ONLINE_LOGIN: 'offline_last_online_login',
    OFFLINE_VALIDITY_DAYS: 7, // Credentials valid for 7 days offline
};

export interface CachedCredentials {
    email: string;
    passwordHash: string;
    salt: string;
    createdAt: string;
}

export interface CachedUser {
    id: string;
    employee_id: string;
    name: string;
    email: string;
    role: string;
    office_id?: string;
    office_lat: number;
    office_long: number;
    allowed_radius: number;
    face_embeddings?: number[][];
    face_verification_status?: string;
}

/**
 * Generate a random salt for password hashing
 */
async function generateSalt(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Hash password with salt using SHA-256
 */
async function hashPassword(password: string, salt: string): Promise<string> {
    const combined = salt + password + salt;
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined
    );
    return hash;
}

/**
 * Cache user credentials for offline login
 * Called after successful online login
 */
export async function cacheCredentials(email: string, password: string): Promise<void> {
    try {
        const salt = await generateSalt();
        const passwordHash = await hashPassword(password, salt);

        const credentials: CachedCredentials = {
            email: email.toLowerCase(),
            passwordHash,
            salt,
            createdAt: new Date().toISOString(),
        };

        // Store in SecureStore (encrypted)
        await SecureStore.setItemAsync(
            KEYS.CACHED_CREDENTIALS,
            JSON.stringify(credentials)
        );

        // Update last online login timestamp
        await AsyncStorage.setItem(
            KEYS.LAST_ONLINE_LOGIN,
            new Date().toISOString()
        );

        console.log('[OfflineAuth] Credentials cached successfully');
    } catch (error) {
        console.error('[OfflineAuth] Failed to cache credentials:', error);
    }
}

/**
 * Cache user data for offline access
 */
export async function cacheUser(user: CachedUser): Promise<void> {
    try {
        await AsyncStorage.setItem(
            KEYS.CACHED_USER,
            JSON.stringify(user)
        );
        console.log('[OfflineAuth] User data cached successfully');
    } catch (error) {
        console.error('[OfflineAuth] Failed to cache user:', error);
    }
}

/**
 * Verify credentials offline
 * Returns cached user if valid, null otherwise
 */
export async function verifyOfflineCredentials(
    email: string,
    password: string
): Promise<CachedUser | null> {
    try {
        // Check if offline login is still valid
        const isValid = await isOfflineLoginValid();
        if (!isValid) {
            console.log('[OfflineAuth] Offline login expired');
            return null;
        }

        // Get cached credentials
        const credentialsJson = await SecureStore.getItemAsync(KEYS.CACHED_CREDENTIALS);
        if (!credentialsJson) {
            console.log('[OfflineAuth] No cached credentials found');
            return null;
        }

        const credentials: CachedCredentials = JSON.parse(credentialsJson);

        // Check email match
        if (credentials.email !== email.toLowerCase()) {
            console.log('[OfflineAuth] Email mismatch');
            return null;
        }

        // Verify password
        const inputHash = await hashPassword(password, credentials.salt);
        if (inputHash !== credentials.passwordHash) {
            console.log('[OfflineAuth] Password mismatch');
            return null;
        }

        // Get cached user data
        const userJson = await AsyncStorage.getItem(KEYS.CACHED_USER);
        if (!userJson) {
            console.log('[OfflineAuth] No cached user data');
            return null;
        }

        console.log('[OfflineAuth] Offline login successful');
        return JSON.parse(userJson);

    } catch (error) {
        console.error('[OfflineAuth] Verification error:', error);
        return null;
    }
}

/**
 * Check if offline login is still valid (within validity period)
 */
export async function isOfflineLoginValid(): Promise<boolean> {
    try {
        const lastOnlineLogin = await AsyncStorage.getItem(KEYS.LAST_ONLINE_LOGIN);
        if (!lastOnlineLogin) {
            return false;
        }

        const lastLogin = new Date(lastOnlineLogin);
        const now = new Date();
        const diffDays = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

        return diffDays <= KEYS.OFFLINE_VALIDITY_DAYS;
    } catch {
        return false;
    }
}

/**
 * Get remaining offline validity in days
 */
export async function getOfflineValidityRemaining(): Promise<number> {
    try {
        const lastOnlineLogin = await AsyncStorage.getItem(KEYS.LAST_ONLINE_LOGIN);
        if (!lastOnlineLogin) {
            return 0;
        }

        const lastLogin = new Date(lastOnlineLogin);
        const now = new Date();
        const diffDays = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

        return Math.max(0, KEYS.OFFLINE_VALIDITY_DAYS - diffDays);
    } catch {
        return 0;
    }
}

/**
 * Check if cached credentials exist
 */
export async function hasCachedCredentials(): Promise<boolean> {
    try {
        const credentials = await SecureStore.getItemAsync(KEYS.CACHED_CREDENTIALS);
        return credentials !== null;
    } catch {
        return false;
    }
}

/**
 * Get cached user without verification (for auto-login scenarios)
 */
export async function getCachedUser(): Promise<CachedUser | null> {
    try {
        const userJson = await AsyncStorage.getItem(KEYS.CACHED_USER);
        if (!userJson) return null;
        return JSON.parse(userJson);
    } catch {
        return null;
    }
}

/**
 * Clear all cached credentials (on logout)
 */
export async function clearCachedCredentials(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(KEYS.CACHED_CREDENTIALS);
        await AsyncStorage.removeItem(KEYS.CACHED_USER);
        await AsyncStorage.removeItem(KEYS.LAST_ONLINE_LOGIN);
        console.log('[OfflineAuth] Cached credentials cleared');
    } catch (error) {
        console.error('[OfflineAuth] Failed to clear credentials:', error);
    }
}

/**
 * Get last online login timestamp
 */
export async function getLastOnlineLogin(): Promise<Date | null> {
    try {
        const timestamp = await AsyncStorage.getItem(KEYS.LAST_ONLINE_LOGIN);
        if (!timestamp) return null;
        return new Date(timestamp);
    } catch {
        return null;
    }
}
