// Main App Entry Point
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from './src/store/authStore';
import { useColors } from './src/store/themeStore';
import { preloadModel } from './src/services/FaceEmbeddingService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import FaceRegistrationScreen from './src/screens/FaceRegistrationScreen';
import TransferRequestScreen from './src/screens/TransferRequestScreen';
import TabNavigator from './src/navigation/TabNavigator';

const Stack = createNativeStackNavigator();

// Preload TFLite model on app start
preloadModel();

function AuthStack() {
  const colors = useColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  const colors = useColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ title: 'Attendance', presentation: 'modal' }}
      />
      <Stack.Screen
        name="FaceRegistration"
        component={FaceRegistrationScreen}
        options={{ title: 'Daftar Wajah', presentation: 'modal' }}
      />
      <Stack.Screen
        name="TransferRequest"
        component={TransferRequestScreen}
        options={{ title: 'Pindah Lokasi', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
