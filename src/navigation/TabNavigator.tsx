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

const TabIcon = ({ icon, label, focused, colors }: { icon: string; label: string; focused: boolean; colors: any }) => (
    <View style={styles.tabIconContainer}>
        <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>{icon}</Text>
        <Text style={[styles.tabLabel, { color: focused ? colors.accent : colors.textMuted }]}>{label}</Text>
    </View>
);

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
                    height: 70,
                    paddingBottom: spacing.sm,
                    paddingTop: spacing.sm,
                },
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Beranda" focused={focused} colors={colors} />,
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Riwayat" focused={focused} colors={colors} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil" focused={focused} colors={colors} />,
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        fontSize: 22,
        marginBottom: 2,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
});
