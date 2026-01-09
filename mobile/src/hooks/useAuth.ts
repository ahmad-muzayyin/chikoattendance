// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\hooks\useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../config/api';

type User = {
    id: number;
    name: string;
    email?: string;
    role: string;
    position?: string;
    branchId?: number;
    profile_picture?: string;
    branch?: {
        id: number;
        name: string;
    };
};

type AuthState = {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
};

export const useAuth = () => {
    const [state, setState] = useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        token: null,
    });

    const checkAuth = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            if (token) {
                // Set default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Try to get cached role, name & branch for instant UI
                const userName = await SecureStore.getItemAsync('userName');
                const userRole = await SecureStore.getItemAsync('userRole');
                const userBranchName = await SecureStore.getItemAsync('userBranchName');

                setState({
                    isLoading: false,
                    isAuthenticated: true,
                    token,
                    user: {
                        id: 0,
                        name: userName || 'User',
                        role: userRole || 'EMPLOYEE',
                        branch: userBranchName ? { id: 0, name: userBranchName } : undefined
                    },
                });

                // Then background fetch for validation & latest data
                try {
                    const res = await axios.get(`${API_CONFIG.BASE_URL}/auth/me`);

                    // Frontend Normalization: Handle Branch (uppercase) vs branch (lowercase)
                    const userData = res.data;
                    if (userData.Branch && !userData.branch) {
                        userData.branch = userData.Branch;
                    }

                    setState(prev => ({
                        ...prev,
                        user: userData
                    }));
                    // Update cache
                    await SecureStore.setItemAsync('userRole', res.data.role || 'EMPLOYEE');
                    await SecureStore.setItemAsync('userName', res.data.name || 'User');
                    if (res.data.branch?.name) {
                        await SecureStore.setItemAsync('userBranchName', res.data.branch.name);
                    }
                } catch (e) {
                    console.log('Token validation failed', e);
                    // Optional: logout if token invalid
                }

            } else {
                setState({
                    isLoading: false,
                    isAuthenticated: false,
                    user: null,
                    token: null,
                });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setState({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
            });
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const { data } = await axios.post(
                `${API_CONFIG.BASE_URL}${ENDPOINTS.LOGIN}`,
                { email, password }
            );

            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('userName', data.user?.name || 'User');
            await SecureStore.setItemAsync('userRole', data.user?.role || 'EMPLOYEE');
            if (data.user?.branch?.name) {
                await SecureStore.setItemAsync('userBranchName', data.user.branch.name);
            }

            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

            setState({
                isLoading: false,
                isAuthenticated: true,
                token: data.token,
                user: data.user,
            });

            return { success: true };
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Login failed';
            return { success: false, error: message };
        }
    }, []);

    const logout = useCallback(async () => {
        // Jangan hapus token agar biometrik tetap bisa dipakai
        // await SecureStore.deleteItemAsync('authToken');
        // await SecureStore.deleteItemAsync('userName');
        // await SecureStore.deleteItemAsync('userRole');

        // Hapus header axios agar request berikutnya tidak otomatis authenticated sebelum login ulang
        delete axios.defaults.headers.common['Authorization'];

        setState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
        });
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return {
        ...state,
        login,
        logout,
        checkAuth,
    };
};

export default useAuth;
