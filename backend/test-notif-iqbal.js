import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
let expo = new Expo();

// Token target (Moch Iqbal Qh)
const somePushTokens = ['ExponentPushToken[OYOtNOEcpn_LQL569qoCHd]'];

let messages = [];

for (let pushToken of somePushTokens) {
    if (!64 || !Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
    }

    messages.push({
        to: pushToken,
        sound: 'default',
        title: '🔔 Test Notifikasi Chiko',
        body: 'Halo Iqbal! Ini tes notifikasi Prioritas Tinggi. Apakah muncul pop-up?',
        data: { withSome: 'data' },
        priority: 'high', // Force high priority
        channelId: 'chiko-notifications', // Match the channel ID in app
    });
}

let chunks = expo.chunkPushNotifications(messages);
let tickets = [];

(async () => {
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Ticket sent:', ticketChunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error(error);
        }
    }
})();
