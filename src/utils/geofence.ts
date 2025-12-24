// Geofence utilities - local distance calculation

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) *
        Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Check if coordinates are within allowed radius
 */
export function isWithinRadius(
    officeLat: number,
    officeLong: number,
    userLat: number,
    userLong: number,
    radiusMeters: number
): boolean {
    const distance = calculateDistance(officeLat, officeLong, userLat, userLong);
    return distance <= radiusMeters;
}

/**
 * Detect teleportation (sudden location jump)
 * If location changes more than 100m in less than 5 seconds, it's suspicious
 */
export function detectTeleportation(
    prevLat: number,
    prevLong: number,
    prevTimestamp: number,
    currentLat: number,
    currentLong: number,
    currentTimestamp: number
): boolean {
    const distance = calculateDistance(prevLat, prevLong, currentLat, currentLong);
    const timeDiff = (currentTimestamp - prevTimestamp) / 1000; // seconds

    // If moved more than 100m in less than 5 seconds
    if (distance > 100 && timeDiff < 5) {
        return true;
    }

    // If moved more than 500m in less than 30 seconds
    if (distance > 500 && timeDiff < 30) {
        return true;
    }

    return false;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}
