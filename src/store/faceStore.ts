// Face Store using Zustand with AsyncStorage persistence (MMKV alternative)
// Using AsyncStorage for better compatibility across environments
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMBEDDINGS_KEY = 'face_embeddings';
const MAX_EMBEDDINGS = 5;

interface FaceState {
    embeddings: number[][];
    isLoaded: boolean;
    isSyncing: boolean;
    lastSyncedAt: number | null;

    // Actions
    loadFromLocal: () => Promise<void>;
    saveToLocal: () => Promise<void>;
    addEmbedding: (embedding: number[]) => Promise<boolean>;
    clearEmbeddings: () => Promise<void>;
    setEmbeddings: (embeddings: number[][]) => void;
    setSyncing: (syncing: boolean) => void;
    setLastSyncedAt: (timestamp: number) => void;
}

export const useFaceStore = create<FaceState>((set, get) => ({
    embeddings: [],
    isLoaded: false,
    isSyncing: false,
    lastSyncedAt: null,

    loadFromLocal: async () => {
        try {
            const stored = await AsyncStorage.getItem(EMBEDDINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                set({
                    embeddings: parsed.embeddings || [],
                    lastSyncedAt: parsed.lastSyncedAt || null,
                    isLoaded: true,
                });
            } else {
                set({ isLoaded: true });
            }
        } catch (error) {
            console.error('Error loading face embeddings from storage:', error);
            set({ isLoaded: true });
        }
    },

    saveToLocal: async () => {
        try {
            const { embeddings, lastSyncedAt } = get();
            await AsyncStorage.setItem(
                EMBEDDINGS_KEY,
                JSON.stringify({ embeddings, lastSyncedAt })
            );
        } catch (error) {
            console.error('Error saving face embeddings to storage:', error);
        }
    },

    addEmbedding: async (embedding: number[]) => {
        const { embeddings, saveToLocal } = get();

        if (embeddings.length >= MAX_EMBEDDINGS) {
            console.warn('Maximum embeddings reached');
            return false;
        }

        const newEmbeddings = [...embeddings, embedding];
        set({ embeddings: newEmbeddings });
        await saveToLocal();
        return true;
    },

    clearEmbeddings: async () => {
        set({ embeddings: [], lastSyncedAt: null });
        await AsyncStorage.removeItem(EMBEDDINGS_KEY);
    },

    setEmbeddings: (embeddings: number[][]) => {
        // Limit to max embeddings
        const limitedEmbeddings = embeddings.slice(0, MAX_EMBEDDINGS);
        set({ embeddings: limitedEmbeddings });
        get().saveToLocal();
    },

    setSyncing: (syncing: boolean) => {
        set({ isSyncing: syncing });
    },

    setLastSyncedAt: (timestamp: number) => {
        set({ lastSyncedAt: timestamp });
        get().saveToLocal();
    },
}));

/**
 * Sync face embeddings from server to local storage
 * Call this after login or when user updates their face data
 */
export async function syncFaceEmbeddingsFromServer(
    serverEmbeddings: number[][] | null | undefined
): Promise<void> {
    const store = useFaceStore.getState();

    store.setSyncing(true);

    try {
        if (serverEmbeddings && serverEmbeddings.length > 0) {
            store.setEmbeddings(serverEmbeddings);
            store.setLastSyncedAt(Date.now());
            console.log(`Synced ${serverEmbeddings.length} face embeddings from server`);
        } else {
            console.log('No face embeddings on server to sync');
        }
    } catch (error) {
        console.error('Error syncing face embeddings:', error);
    } finally {
        store.setSyncing(false);
    }
}

/**
 * Initialize face store - call on app start
 */
export async function initializeFaceStore(): Promise<void> {
    const store = useFaceStore.getState();
    await store.loadFromLocal();
}
