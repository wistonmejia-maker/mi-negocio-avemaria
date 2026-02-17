// Mi Negocio AVEMARÍA — Auth Store (Zustand)

import { create } from 'zustand';
import api from '../lib/api';
import type { User, LoginResponse } from '../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: { name: string; businessName: string }) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.post<{ success: true; data: LoginResponse }>('/auth/login', { email, password });
            const { user, accessToken, refreshToken } = data.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            const message = err.response?.data?.error || 'Error al iniciar sesión';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    logout: async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({ user: null, isAuthenticated: false });
        }
    },

    fetchProfile: async () => {
        try {
            const { data } = await api.get<{ success: true; data: User }>('/auth/me');
            set({ user: data.data, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    },

    updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await api.put<{ success: true; data: User }>('/auth/profile', data);
            set({ user: response.data, isLoading: false });
        } catch (err: any) {
            const message = err.response?.data?.error || 'Error al actualizar perfil';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    clearError: () => set({ error: null }),
}));
