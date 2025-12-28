// Auth Store using Zustand (simplified without persistence for initial testing)
import { create } from 'zustand';
import { cacheFaceEmbeddings, clearCachedEmbeddings, clearPendingAttendance } from '../services/OfflineService';

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

    // Actions
    setUser: (user: User) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    updateFaceEmbeddings: (embeddings: number[][]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,

    setUser: (user) => {
        set({ user });
        // Cache face embeddings for offline use
        if (user.face_embeddings && user.face_embeddings.length > 0) {
            cacheFaceEmbeddings(user.id, user.face_embeddings);
        }
    },

    setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

    login: (user, accessToken, refreshToken) => {
        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
        });
        // Cache face embeddings for offline use
        if (user.face_embeddings && user.face_embeddings.length > 0) {
            cacheFaceEmbeddings(user.id, user.face_embeddings);
        }
    },

    logout: () => {
        // Clear offline data on logout
        clearCachedEmbeddings();
        clearPendingAttendance();
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
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
}));

