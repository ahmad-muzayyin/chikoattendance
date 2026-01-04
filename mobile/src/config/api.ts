// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\config\api.ts
import axios from 'axios';

// Konfigurasi URL API
// Ganti IP ini dengan IP laptop Anda (IPv4 dari ipconfig)
// Gunakan 192.168.1.2 jika HP dan Laptop di Wi-Fi yang sama
// Gunakan 10.0.2.2 jika menggunakan Emulator Android di Laptop
export const API_CONFIG = {
    // PENTING: Ganti sesuai environment Anda
    // Emulator Android: Gunakan 10.0.2.2
    // HP Fisik (scan QR): Gunakan IPv4 Laptop (cek 'ipconfig', misal: 192.168.1.x)
    // BASE_URL: 'http://34.50.89.217/api',
    BASE_URL: 'http://192.168.1.2:3000/api',
    TIMEOUT: 15000,
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
