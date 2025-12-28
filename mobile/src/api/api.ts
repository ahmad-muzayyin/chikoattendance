import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your machine's IP address for physical device testing
// e.g., 'http://192.168.1.10:3000/api'
const BASE_URL = 'http://10.0.2.2:3000/api'; // Android Emulator default

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const checkIn = async (latitude: number, longitude: number, deviceId: string) => {
    return api.post('/attendance/checkin', { latitude, longitude, deviceId });
};

export const checkOut = async (latitude: number, longitude: number, deviceId: string) => {
    return api.post('/attendance/checkout', { latitude, longitude, deviceId });
};

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
        await SecureStore.setItemAsync('token', response.data.token);
    }
    return response.data;
};

export default api;
