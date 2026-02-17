// Mi Negocio AVEMARÍA — Mobile Auth Store

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface User {
    id: string;
    email: string;
    name: string;
    businessName: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.post('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = data.data;
            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.error || 'Error al iniciar sesión', isLoading: false });
            throw err;
        }
    },

    logout: async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) await api.post('/auth/logout', { refreshToken });
        } catch { }
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data.data, isAuthenticated: true, isLoading: false });
        } catch {
            set({ isAuthenticated: false, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));
