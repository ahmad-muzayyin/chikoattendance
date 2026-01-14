// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\config\api.ts
import axios from 'axios';

export const API_CONFIG = {
    // 1. DEVELOPMENT (Expo Go / Emulator)
    // BASE_URL: 'http://192.168.1.46:3000/api',

    // 2. PRODUCTION (VPS / Hosting)
    // Ganti dengan IP VPS atau Domain Anda saat build APK
    BASE_URL: 'http://34.50.89.217/api',

    TIMEOUT: 15000,
    GOOGLE_CLIENT_IDS: {
        ANDROID: '255748235220-d824oiok9fj3ad5l5a8h4152d4cvq0dq.apps.googleusercontent.com',
        WEB: '255748235220-1bs742posq9cu07m3udjtdr2f8mddkb3.apps.googleusercontent.com',
        IOS: '',
    },
    EXPO_REDIRECT_URI: 'https://auth.expo.io/@amue07/chiko-attendance'
};

export const ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    CHECK_IN: '/attendance/checkin',
    CHECK_OUT: '/attendance/checkout',
    CALENDAR: '/attendance/calendar',
    RECAP: '/attendance/recap',
    HISTORY: '/attendance/history',
    POINTS: '/attendance/points',
    SETTINGS: '/admin/settings',
};

export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Log request untuk debugging
apiClient.interceptors.request.use(request => {
    console.log('Starting Request:', request.method?.toUpperCase(), request.url);
    return request;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log('API Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else if (error.request) {
            console.log('No response received (Network Error)');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
