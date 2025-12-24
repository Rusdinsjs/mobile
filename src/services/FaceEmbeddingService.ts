// Face Embedding Service
// Handles face embedding extraction and comparison
// Note: This is a simplified implementation for Expo Go compatibility

// Configuration
const EMBEDDING_THRESHOLD = 0.6;

export interface FaceDetectionResult {
    detected: boolean;
    faceCount: number;
    bounds?: { x: number; y: number; width: number; height: number };
    error?: string;
}

export interface EmbeddingCompareResult {
    isMatch: boolean;
    distance: number;
    confidence: number;
}

/**
 * Simplified face detection - always returns true for Expo Go compatibility
 * In production with development build, use expo-face-detector
 */
export async function detectFaces(_imageUri: string): Promise<FaceDetectionResult> {
    // For Expo Go, we skip face detection and assume face is present
    // User should position their face correctly based on UI guide
    return {
        detected: true,
        faceCount: 1,
    };
}

/**
 * Extract face embedding from an image
 * This is a placeholder implementation.
 * For production, use TensorFlow Lite with MobileFaceNet or similar model.
 *
 * @param imageUri - URI of the face image
 * @returns Array of 128 floats representing the face embedding
 */
export async function extractEmbedding(imageUri: string): Promise<number[] | null> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate a pseudo-random embedding based on image URI hash
    // In production, this would run the image through a TFLite model
    const embedding = generatePseudoEmbedding(imageUri);

    return embedding;
}

/**
 * Calculate Euclidean distance between two embeddings
 */
export function calculateEuclideanDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embedding dimensions must match');
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
        const diff = embedding1[i] - embedding2[i];
        sum += diff * diff;
    }

    return Math.sqrt(sum);
}

/**
 * Compare a face embedding against stored embeddings
 * @param testEmbedding - The embedding to test
 * @param storedEmbeddings - Array of up to 5 stored embeddings
 * @returns Comparison result with best match distance
 */
export function compareEmbeddings(
    testEmbedding: number[],
    storedEmbeddings: number[][]
): EmbeddingCompareResult {
    if (storedEmbeddings.length === 0) {
        return { isMatch: false, distance: Infinity, confidence: 0 };
    }

    // Find minimum distance across all stored embeddings
    let minDistance = Infinity;
    for (const stored of storedEmbeddings) {
        const distance = calculateEuclideanDistance(testEmbedding, stored);
        if (distance < minDistance) {
            minDistance = distance;
        }
    }

    // Calculate confidence (inverse of distance, normalized)
    const confidence = Math.max(0, Math.min(1, 1 - minDistance / 2));

    return {
        isMatch: minDistance < EMBEDDING_THRESHOLD,
        distance: minDistance,
        confidence,
    };
}

/**
 * Generate a pseudo-embedding for testing
 * This creates a deterministic "embedding" based on the image URI
 */
function generatePseudoEmbedding(imageUri: string): number[] {
    const embedding: number[] = [];
    const seed = hashCode(imageUri);

    // Generate 128 pseudo-random values
    for (let i = 0; i < 128; i++) {
        const value = Math.sin(seed * (i + 1)) * 10000;
        embedding.push((value - Math.floor(value)) * 2 - 1);
    }

    return embedding;
}

/**
 * Simple hash function for strings
 */
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash;
}
