// Mi Negocio AVEMARÍA — Mobile Navigation

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import NewSaleScreen from '../screens/NewSaleScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProfitsScreen from '../screens/ProfitsScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.cream },
                headerTitleStyle: { fontWeight: '500', color: colors.ink, fontSize: 16 },
                headerShadowVisible: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: colors.border,
                    paddingTop: 4,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    letterSpacing: 0.5,
                    marginTop: -2,
                    marginBottom: 6,
                },
                tabBarActiveTintColor: colors.gold,
                tabBarInactiveTintColor: colors.ink4,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'Dashboard',
                    headerTitle: 'Mi Negocio AVEMARÍA',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="NewSale"
                component={NewSaleScreen}
                options={{
                    title: 'Vender',
                    headerTitle: 'Nueva Venta',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="Inventory"
                component={InventoryScreen}
                options={{
                    title: 'Inventario',
                    headerTitle: 'Inventario',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="Profits"
                component={ProfitsScreen}
                options={{
                    title: 'Ganancias',
                    headerTitle: 'Ganancias',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="💎" focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
}
