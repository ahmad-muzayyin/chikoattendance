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
        shouldSetBadge: true,
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
            await Notifications.setNotificationChannelAsync('chiko-notifications', {
                name: 'Chiko Notifications',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
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
                // 1. Try to get FCM Device Token (For Production/APK)
                // This requires google-services.json to be configured in app.json and present in root
                const deviceAppData = await Notifications.getDevicePushTokenAsync();
                token = deviceAppData.data;
                console.log('FCM Device Token Obtained:', token);
            } catch (e: any) {
                console.warn('FCM Token skipped (OK for Expo Go):', e.message);

                // 2. Fallback to Expo Token (For Development/Expo Go)
                // This allows development without Google Services strict config
                try {
                    const projectData = await Notifications.getExpoPushTokenAsync({
                        projectId: '5d34e301-94d3-4555-9ab0-134a376cc49e' // From app.json extra.eas.projectId
                    });
                    token = projectData.data;
                    console.log('Expo Push Token (Fallback):', token);
                } catch (expoError) {
                    console.error('Error fetching Expo token:', expoError);
                }
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
