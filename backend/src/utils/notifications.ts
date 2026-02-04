import { Expo } from 'expo-server-sdk';
import { User } from '../models/User';
import { UserRole } from '../models/User';
import { Notification } from '../models/Notification';
import { admin, isFirebaseInitialized } from '../config/firebase';

const expo = new Expo();

export const sendPushNotification = async (userIds: number[], title: string, body: string, data: any = {}) => {
    try {
        // 1. Save to Database for Persistence
        const notificationsData = userIds.map(id => ({
            userId: id,
            title,
            message: body,
            data: JSON.stringify(data),
            type: data?.type || 'INFO'
        }));
        await Notification.bulkCreate(notificationsData);

        // 2. Send Push Notification
        const users = await User.findAll({ where: { id: userIds } });
        const expoMessages: any[] = [];
        const fcmTokens: string[] = [];

        for (const user of users) {
            if (!user.pushToken) continue;

            if (Expo.isExpoPushToken(user.pushToken)) {
                expoMessages.push({
                    to: user.pushToken,
                    sound: 'default',
                    title,
                    body,
                    data,
                    priority: 'high',
                    channelId: 'chiko-notifications',
                });
            } else {
                // Assume it is FCM Device Token (if not Expo token)
                fcmTokens.push(user.pushToken);
            }
        }

        // A. Send Expo Messages
        if (expoMessages.length > 0) {
            const chunks = expo.chunkPushNotifications(expoMessages);
            for (const chunk of chunks) {
                try {
                    await expo.sendPushNotificationsAsync(chunk);
                } catch (error) {
                    console.error('[Expo] Error sending push chunk:', error);
                }
            }
        }

        // B. Send FCM Messages (Direct)
        if (fcmTokens.length > 0) {
            if (isFirebaseInitialized) {
                try {
                    // Normalize data to string values for FCM data payload
                    const fcmData = Object.keys(data).reduce((acc: any, key) => {
                        acc[key] = String(data[key]);
                        return acc;
                    }, {});

                    const message = {
                        notification: { title, body },
                        data: fcmData,
                        tokens: fcmTokens,
                        android: {
                            priority: 'high' as const,
                            notification: {
                                sound: 'default',
                                channelId: 'chiko-notifications',
                                priority: 'max' as const,
                                defaultSound: true
                            }
                        }
                    };

                    const response = await admin.messaging().sendEachForMulticast(message);
                    console.log(`[FCM] Sent ${response.successCount} messages, ${response.failureCount} failed.`);

                } catch (error) {
                    console.error('[FCM] Error sending multicast:', error);
                }
            } else {
                console.warn('[FCM] Skipping FCM tokens because Firebase is not initialized (missing serviceAccountKey.json)');
            }
        }

    } catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
};

// Notify Superior based on hierarchy
export const notifySuperior = async (senderId: number, title: string, body: string, data: any = {}) => {
    try {
        const sender = await User.findByPk(senderId);
        if (!sender) return;

        let targetRole = UserRole.OWNER; // Default target
        let targetBranchId: number | null = null; // Default global (for Owner)

        // Hierarchy Logic
        if (sender.role === UserRole.EMPLOYEE) {
            // Employee -> Report to HEAD
            targetRole = UserRole.HEAD;
            targetBranchId = sender.branchId;
        } else if (sender.role === UserRole.HEAD) {
            // Head -> Report to Owner
            targetRole = UserRole.OWNER;
            targetBranchId = null; // Owner has no specific branch constraint usually, or sees all
        }

        // Find Targets
        let whereClause: any = { role: targetRole };

        // Strict Scoping for HEAD: Must match branchId
        if (targetRole === UserRole.HEAD) {
            if (targetBranchId) {
                whereClause.branchId = targetBranchId;
            } else {
                // If targeting HEAD but no branch defined, DO NOT broadcast.
                // Force empty result to trigger fallback to OWNER.
                whereClause.branchId = -1; // Impossible ID
            }
        }

        let recipients = await User.findAll({ where: whereClause });

        // Fallback: If Employee sends but no HEAD exists (or no branch assigned), notify OWNER
        if (recipients.length === 0 && targetRole === UserRole.HEAD) {
            // console.log('No HEAD found for branch, fallback to OWNER');
            recipients = await User.findAll({ where: { role: UserRole.OWNER } });
        }

        const recipientIds = recipients.map(u => u.id);
        if (recipientIds.length > 0) {
            await sendPushNotification(recipientIds, title, body, data);
        }
    } catch (error) {
        console.error('Error in notifySuperior:', error);
    }
};
