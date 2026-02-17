// Mi Negocio AVEMARÍA — Mobile App Entry

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from './src/authStore';
import LoginScreen from './src/screens/LoginScreen';
import { MainTabs } from './src/navigation/Navigation';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
                <ActivityIndicator size="large" color={colors.gold} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <Stack.Screen name="Main" component={MainTabs} />
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
