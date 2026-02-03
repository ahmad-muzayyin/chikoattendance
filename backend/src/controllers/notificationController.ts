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

export const sendTestNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { sendPushNotification } = require('../utils/notifications');
        await sendPushNotification(
            [userId],
            'Test Notifikasi',
            'Ini adalah notifikasi percobaan dari server Chiko Attendance.',
            { type: 'SUCCESS' }
        );

        res.json({ message: 'Notifikasi test dikirim!' });
    } catch (error) {
        console.error('Test notif error', error);
        res.status(500).json({ message: 'Gagal mengirim test notifikasi' });
    }
};
