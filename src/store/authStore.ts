// Auth Store using Zustand (simplified without persistence for initial testing)
import { create } from 'zustand';

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

    setUser: (user) => set({ user }),

    setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

    login: (user, accessToken, refreshToken) =>
        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
        }),

    logout: () =>
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    updateFaceEmbeddings: (embeddings) =>
        set((state) => ({
            user: state.user ? { ...state.user, face_embeddings: embeddings } : null,
        })),
}));
