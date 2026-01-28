import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Handler for foreground notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationService = {
    async registerForPushNotificationsAsync() {
        let token;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    },

    async updatePushToken() {
        try {
            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                const authToken = await SecureStore.getItemAsync('authToken');
                if (authToken) {
                    await axios.post(`${API_CONFIG.BASE_URL}/auth/push-token`,
                        { pushToken: token },
                        { headers: { Authorization: `Bearer ${authToken}` } }
                    );
                    console.log('Push token updated:', token);
                }
            }
        } catch (error) {
            console.log('Error updating push token:', error);
        }
    },

    async scheduleAttendanceReminder(startTime: string = "08:00", endTime: string = "17:00", hasCheckedIn: boolean = false, hasCheckedOut: boolean = false) {
        // First, cancel all to reset state
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Parse Times (Format "HH:mm")
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        // Reminder Masuk (15 mins before start) -> ONLY IF NOT CHECKED IN
        if (!hasCheckedIn) {
            let notifyStartHour = startHour;
            let notifyStartMinute = startMinute - 15;
            if (notifyStartMinute < 0) {
                notifyStartMinute += 60;
                notifyStartHour -= 1;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Jangan Lupa Absen Masuk! ⏰",
                    body: `Shift kamu mulai jam ${startTime}. Segera check-in ya!`,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: notifyStartHour,
                    minute: notifyStartMinute,
                    repeats: false, // Don't repeat daily blindly, reschedule next day via app usage
                },
            });
        }

        // Reminder Pulang (At end time) -> ONLY IF NOT CHECKED OUT
        // But logic: We usually want this reminder if they are currently working (checked in but not out).
        // If they haven't even checked in, maybe don't remind to go home? Or maybe yes.
        // Let's assume if !hasCheckedOut, we remind.
        if (!hasCheckedOut) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Waktunya Pulang? 🏠",
                    body: `Shift kamu berakhir jam ${endTime}. Jangan lupa Absen Pulang!`,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: endHour,
                    minute: endMinute,
                    repeats: false,
                },
            });
        }

        console.log(`Attendance reminders synced. In: ${hasCheckedIn}, Out: ${hasCheckedOut}`);
    },

    async cancelAllReminders() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
};
