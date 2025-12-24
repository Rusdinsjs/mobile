// Notification Service - Push and Local Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationConfig {
    title: string;
    body: string;
    data?: Record<string, any>;
    trigger?: Notifications.NotificationTriggerInput;
}

class NotificationService {
    private expoPushToken: string | null = null;

    async initialize(): Promise<string | null> {
        // Skip push token on non-device (emulator/simulator)
        if (!Device.isDevice) {
            console.log('📱 Running on emulator - local notifications only');
            return null;
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('⚠️ Notification permission not granted');
                return null;
            }

            // Android requires notification channel
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'AttendX Notifications',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#06B6D4',
                });
            }

            // Try to get push token
            try {
                const tokenData = await Notifications.getExpoPushTokenAsync();
                this.expoPushToken = tokenData.data;
                console.log('✅ Push token obtained');
                return this.expoPushToken;
            } catch (tokenError) {
                console.log('📱 Push token unavailable (normal for dev mode)');
                return null;
            }
        } catch (error) {
            console.log('📱 Notifications init error:', error);
            return null;
        }
    }

    async scheduleNotification(config: NotificationConfig): Promise<string> {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: config.title,
                body: config.body,
                data: config.data || {},
            },
            trigger: config.trigger || null,
        });
    }

    async scheduleCheckInReminder(hour: number = 8, minute: number = 0): Promise<string> {
        await this.cancelAllReminders();
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: '⏰ Reminder Check-In',
                body: 'Jangan lupa melakukan check-in hari ini!',
                data: { type: 'check_in_reminder' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
    }

    async scheduleCheckOutReminder(hour: number = 17, minute: number = 0): Promise<string> {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: '🚪 Reminder Check-Out',
                body: 'Jangan lupa melakukan check-out sebelum pulang!',
                data: { type: 'check_out_reminder' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
    }

    async cancelAllReminders(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    addNotificationListener(callback: (n: Notifications.Notification) => void) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    addResponseListener(callback: (r: Notifications.NotificationResponse) => void) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }
}

export const notificationService = new NotificationService();
export default notificationService;
