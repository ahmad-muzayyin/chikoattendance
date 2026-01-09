
import cron from 'node-cron';
import { User, UserRole } from '../models/User';
import { Attendance, AttendanceType } from '../models/Attendance';
import { Punishment } from '../models/Punishment';
import { Op } from 'sequelize';
import { sendPushNotification } from './notifications';

export const initScheduler = () => {
    console.log('[Scheduler] Initialized. Alpha checker running at 23:55 daily.');

    // Run every day at 23:55 (11:55 PM)
    cron.schedule('55 23 * * *', async () => {
        console.log('[Scheduler] Running Daily Alpha Check...');
        try {
            const now = new Date();
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));

            // 1. Get All Active Employees (Exclude OWNER, maybe SUPERVISOR?)
            // Assuming supervisors also need to absent.
            const users = await User.findAll({
                where: {
                    role: {
                        [Op.notIn]: [UserRole.OWNER]
                    }
                }
            });

            for (const user of users) {
                // 2. Check if attendance exists for today
                const attendance = await Attendance.findOne({
                    where: {
                        userId: user.id,
                        timestamp: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                // 3. If no attendance, mark as ALPHA
                if (!attendance) {
                    console.log(`[Scheduler] Marking ALPHA for User: ${user.name} (${user.id})`);

                    // Create Alpha Record
                    await Attendance.create({
                        userId: user.id,
                        type: AttendanceType.ALPHA,
                        timestamp: new Date(), // Mark at 23:55
                        latitude: 0,
                        longitude: 0,
                        deviceId: 'SYSTEM_SCHEDULER',
                        isLate: false,
                        isOvertime: false,
                        isHalfDay: false,
                        notes: 'Tidak Absen (Auto Alpha)'
                    });

                    // Create Punishment (e.g., 20 points for Alpha)
                    const penaltyPoints = 20;
                    await Punishment.create({
                        userId: user.id,
                        points: penaltyPoints,
                        reason: 'Alpha (Tidak Masuk Tanpa Keterangan)',
                        date: new Date()
                    });

                    // Send Notification
                    // Only send if token exists, handled by util
                    await sendPushNotification(
                        [user.id],
                        'Terhitung Alpha',
                        'Anda tidak melakukan absensi hari ini. Sistem mencatat sebagai Alpha (-20 Poin).',
                        { type: 'ALPHA_ALERT' }
                    );
                }
            }
            console.log('[Scheduler] Alpha Check Completed.');

        } catch (error) {
            console.error('[Scheduler] Error in Alpha Check:', error);
        }
    });
};
