// API Client configuration
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Change this to your backend URL
// Change this to your backend URL
export const API_BASE_URL = 'http://192.168.100.7:8080'; // Android emulator localhost
// const API_BASE_URL = 'http://localhost:8080'; // iOS simulator

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token, refresh_token } = response.data;
                    useAuthStore.getState().setTokens(access_token, refresh_token);

                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API endpoints
export const authAPI = {
    register: (data: { employee_id: string; name: string; email: string; password: string }) =>
        apiClient.post('/api/auth/register', data),

    login: (data: { email: string; password: string }) =>
        apiClient.post('/api/auth/login', data),

    refresh: (refreshToken: string) =>
        apiClient.post('/api/auth/refresh', { refresh_token: refreshToken }),
};

export const userAPI = {
    getProfile: () => apiClient.get('/api/users/me'),
    syncFace: () => apiClient.get('/api/users/sync-face'),
    updateFaceEmbeddings: (embeddings: number[][]) =>
        apiClient.put('/api/users/face-embeddings', { face_embeddings: embeddings }),
    changePassword: (data: { current_password: string; new_password: string }) =>
        apiClient.put('/api/users/password', data),
    uploadFacePhotos: (photoUris: string[]) => {
        const formData = new FormData();
        photoUris.forEach((uri, index) => {
            const filename = `face_${index + 1}.jpg`;
            formData.append('photos', {
                uri: uri,
                name: filename,
                type: 'image/jpeg',
            } as any);
        });
        return apiClient.post('/api/users/face-photos', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000, // 60s for large uploads
        });
    },
};

export const attendanceAPI = {
    checkIn: (data: { latitude: number; longitude: number; device_info: string; is_mock_location: boolean }) =>
        apiClient.post('/api/attendance/check-in', data),

    checkOut: (data: { latitude: number; longitude: number; device_info: string }) =>
        apiClient.post('/api/attendance/check-out', data),

    getTodayStatus: () => apiClient.get('/api/attendance/today'),

    getHistory: (limit = 30, offset = 0) =>
        apiClient.get(`/api/attendance/history?limit=${limit}&offset=${offset}`),
};

export const commonAPI = {
    getSettings: () => apiClient.get('/api/kiosk/settings'),
};

export default apiClient;
