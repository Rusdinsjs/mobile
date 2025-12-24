// Location hook with mock detection
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { detectTeleportation } from '../utils/geofence';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    isMockLocation: boolean;
    timestamp: number | null;
    error: string | null;
    isLoading: boolean;
}

interface UseLocationReturn extends LocationState {
    refreshLocation: () => Promise<void>;
    checkPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationReturn {
    const [state, setState] = useState<LocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        isMockLocation: false,
        timestamp: null,
        error: null,
        isLoading: false,
    });

    const [prevLocation, setPrevLocation] = useState<{
        lat: number;
        long: number;
        timestamp: number;
    } | null>(null);

    const checkPermission = useCallback(async (): Promise<boolean> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Permission error:', error);
            return false;
        }
    }, []);

    const refreshLocation = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const hasPermission = await checkPermission();
            if (!hasPermission) {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: 'Location permission denied',
                }));
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;
            const accuracy = location.coords.accuracy ?? 0;
            const timestamp = location.timestamp;

            // Check for mock location (Android)
            // Note: This requires expo-location >= 15.0
            let isMockLocation = false;
            if (location.mocked !== undefined) {
                isMockLocation = location.mocked;
            }

            // Check for teleportation
            if (prevLocation) {
                const isTeleported = detectTeleportation(
                    prevLocation.lat,
                    prevLocation.long,
                    prevLocation.timestamp,
                    latitude,
                    longitude,
                    timestamp
                );
                if (isTeleported) {
                    isMockLocation = true;
                }
            }

            // Check accuracy - if too low, might be spoofed
            if (accuracy > 100) {
                // Accuracy worse than 100m is suspicious
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: 'Location accuracy too low. Please try again.',
                }));
                return;
            }

            setPrevLocation({ lat: latitude, long: longitude, timestamp });

            setState({
                latitude,
                longitude,
                accuracy,
                isMockLocation,
                timestamp,
                error: null,
                isLoading: false,
            });
        } catch (error) {
            console.error('Location error:', error);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: 'Failed to get location',
            }));
        }
    }, [checkPermission, prevLocation]);

    // Get initial location on mount
    useEffect(() => {
        refreshLocation();
    }, []);

    return {
        ...state,
        refreshLocation,
        checkPermission,
    };
}
