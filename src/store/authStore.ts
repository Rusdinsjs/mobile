// Auth Store using Zustand with Offline Login Support
import { create } from 'zustand';
import { cacheFaceEmbeddings, clearCachedEmbeddings, clearPendingAttendance } from '../services/OfflineService';
import {
    cacheCredentials,
    cacheUser,
    verifyOfflineCredentials,
    clearCachedCredentials,
    isOfflineLoginValid,
    hasCachedCredentials,
    type CachedUser,
} from '../services/OfflineAuthService';

interface User {
    id: string;
    employee_id: string;
    name: string;
    email: string;
    role: string;
    office_lat: number;
    office_long: number;
    allowed_radius: number;
    face_embeddings?: number[][];
    face_verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
    office_id?: string;
    office?: {
        id: string;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        radius: number;
    };
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isOfflineMode: boolean;

    // Actions
    setUser: (user: User) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    login: (user: User, accessToken: string, refreshToken: string, password?: string) => void;
    loginOffline: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    updateFaceEmbeddings: (embeddings: number[][]) => void;
    checkOfflineLoginAvailable: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    isOfflineMode: false,

    setUser: (user) => {
        set({ user });
        // Cache face embeddings for offline use
        if (user.face_embeddings && user.face_embeddings.length > 0) {
            cacheFaceEmbeddings(user.id, user.face_embeddings);
        }
        // Cache user data for offline login
        cacheUser({
            id: user.id,
            employee_id: user.employee_id,
            name: user.name,
            email: user.email,
            role: user.role,
            office_id: user.office_id,
            office_lat: user.office_lat,
            office_long: user.office_long,
            allowed_radius: user.allowed_radius,
            face_embeddings: user.face_embeddings,
            face_verification_status: user.face_verification_status,
        });
    },

    setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

    login: (user, accessToken, refreshToken, password) => {
        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            isOfflineMode: false,
        });

        // Cache face embeddings for offline use
        if (user.face_embeddings && user.face_embeddings.length > 0) {
            cacheFaceEmbeddings(user.id, user.face_embeddings);
        }

        // Cache credentials for offline login (if password provided)
        if (password) {
            cacheCredentials(user.email, password);
        }

        // Cache user data for offline login
        cacheUser({
            id: user.id,
            employee_id: user.employee_id,
            name: user.name,
            email: user.email,
            role: user.role,
            office_id: user.office_id,
            office_lat: user.office_lat,
            office_long: user.office_long,
            allowed_radius: user.allowed_radius,
            face_embeddings: user.face_embeddings,
            face_verification_status: user.face_verification_status,
        });
    },

    loginOffline: async (email: string, password: string): Promise<boolean> => {
        console.log('[AuthStore] Attempting offline login...');

        const cachedUser = await verifyOfflineCredentials(email, password);

        if (cachedUser) {
            set({
                user: cachedUser as User,
                accessToken: null, // No token in offline mode
                refreshToken: null,
                isAuthenticated: true,
                isLoading: false,
                isOfflineMode: true,
            });

            // Cache face embeddings from cached user
            if (cachedUser.face_embeddings && cachedUser.face_embeddings.length > 0) {
                cacheFaceEmbeddings(cachedUser.id, cachedUser.face_embeddings);
            }

            console.log('[AuthStore] Offline login successful');
            return true;
        }

        console.log('[AuthStore] Offline login failed');
        return false;
    },

    logout: () => {
        // Clear offline data on logout
        clearCachedEmbeddings();
        clearPendingAttendance();
        clearCachedCredentials();
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isOfflineMode: false,
        });
    },

    setLoading: (isLoading) => set({ isLoading }),

    updateFaceEmbeddings: (embeddings) =>
        set((state) => {
            // Also update offline cache
            if (state.user) {
                cacheFaceEmbeddings(state.user.id, embeddings);
            }
            return {
                user: state.user ? { ...state.user, face_embeddings: embeddings } : null,
            };
        }),

    checkOfflineLoginAvailable: async (): Promise<boolean> => {
        const hasCredentials = await hasCachedCredentials();
        const isValid = await isOfflineLoginValid();
        return hasCredentials && isValid;
    },
}));
