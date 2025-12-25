// Tab Navigator with Dynamic Theming
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../styles/theme';
import { useColors } from '../store/themeStore';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const colors = useColors();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.surfaceLight,
                    borderTopWidth: 1,
                    height: 75,
                    paddingBottom: 12,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: -4,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Beranda',
                    tabBarIcon: ({ focused }) => (
                        <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>🏠</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarLabel: 'Riwayat',
                    tabBarIcon: ({ focused }) => (
                        <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>📋</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({ focused }) => (
                        <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>👤</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabIcon: {
        fontSize: 22,
    },
});

