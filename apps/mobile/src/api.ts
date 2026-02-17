// Mi Negocio AVEMARÍA — Mobile API Client

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Change to your machine's local IP when testing on a physical device
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh');
                const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                await AsyncStorage.setItem('accessToken', data.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(originalRequest);
            } catch {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    },
);

export default api;
