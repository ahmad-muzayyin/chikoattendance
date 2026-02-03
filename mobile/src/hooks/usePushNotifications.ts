
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

    async function registerForPushNotificationsAsync() {
        let token;
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Permission not granted for push notifications');
                return;
            }
            try {
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: '0c277e4c-50cb-4331-a6d0-fb9c11201c94'
                })).data;
                console.log('Expo Push Token Message:', token); // Changed log
            } catch (e) {
                console.error('Error fetching push token', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    const sendTokenToBackend = async (token: string) => {
        try {
            const authToken = await SecureStore.getItemAsync('authToken');
            if (!authToken) return;

            await axios.post(`${API_CONFIG.BASE_URL}/auth/push-token`,
                { pushToken: token },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log('Push Token sent to backend successfully');
        } catch (error) {
            console.error('Failed to send push token to backend:', error);
        }
    };

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            setExpoPushToken(token);
            if (token) {
                sendTokenToBackend(token);
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification tapped:', response);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    return {
        expoPushToken,
        notification,
    };
};
