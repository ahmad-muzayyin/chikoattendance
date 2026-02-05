import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Notification } from '../models/Notification';

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const notif = await Notification.findOne({ where: { id, userId } });
        if (notif) {
            notif.isRead = true;
            await notif.save();
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const result = await Notification.destroy({ where: { id, userId } });

        if (result === 0) {
            return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
        }

        res.json({ success: true, message: 'Notifikasi dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

import { User } from '../models/User';

export const sendTestNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { sendPushNotification } = require('../utils/notifications');

        let targetIds: number[] = [];
        let title = 'Jangan Lupa Absen!';
        let message = 'Jangan lupa melakukan Absensi Masuk/Pulang hari ini ya!';

        // If OWNER or ADMIN triggers this, broadcast to ALL users
        if (userRole === 'OWNER' || userRole === 'ADMIN') {
            const allUsers = await User.findAll({ attributes: ['id'] });
            targetIds = allUsers.map(u => u.id);
            console.log(`[Broadcast] ${userRole} ${userId} sending notification to ${targetIds.length} users.`);

            // Optional: Customize message for broadcast
            title = 'PENGUMUMAN';
            message = 'Jangan lupa untuk melakukan Absensi hari ini. Semangat bekerja!';
        } else {
            // Default: Send only to self
            targetIds = [userId];
        }

        await sendPushNotification(
            targetIds,
            title,
            message,
            { type: 'REMINDER' }
        );

        res.json({ message: `Notifikasi dikirim ke ${targetIds.length} pengguna!` });
    } catch (error) {
        console.error('Test notif error', error);
        res.status(500).json({ message: 'Gagal mengirim test notifikasi' });
    }
};
