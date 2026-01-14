
import cron from 'node-cron';
import { User, UserRole } from '../models/User';
import { Attendance, AttendanceType } from '../models/Attendance';
import { Punishment } from '../models/Punishment';
import { Op } from 'sequelize';
import { sendPushNotification } from './notifications';

export const initScheduler = () => {
    console.log('[Scheduler] Initialized:');
    console.log('  - Alpha checker: 23:55 daily');
    console.log('  - Checkout reminder: Every 30 min (shift-based)');

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

    // Run every 30 minutes - Checkout Reminder (Dynamic based on Shift)
    cron.schedule('*/30 * * * *', async () => {
        console.log('[Scheduler] Running Checkout Reminder Check...');
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));

            // Import Shift model
            const { Shift } = require('../models/Shift');

            // Get all active employees (exclude OWNER) with their shift info
            const users = await User.findAll({
                where: {
                    role: {
                        [Op.notIn]: [UserRole.OWNER]
                    }
                },
                include: [{
                    model: Shift,
                    required: false // LEFT JOIN - include users without shift too
                }]
            });

            for (const user of users) {
                // Skip if user doesn't have a shift
                if (!user.Shift || !user.Shift.endHour) {
                    continue;
                }

                // Parse shift end time
                const [endHour, endMinute] = user.Shift.endHour.split(':').map(Number);

                // Calculate if current time is within reminder window
                // Reminder window: shift end time ± 30 minutes
                const shiftEndMinutes = endHour * 60 + endMinute;
                const currentMinutes = currentHour * 60 + currentMinute;
                const timeDiff = currentMinutes - shiftEndMinutes;

                // Only send if we're within -30 to +30 minutes of shift end
                // AND we haven't sent a reminder in the last hour (to avoid spam)
                if (timeDiff >= -30 && timeDiff <= 30) {
                    // Check if user has checked in today
                    const checkInToday = await Attendance.findOne({
                        where: {
                            userId: user.id,
                            type: AttendanceType.CHECK_IN,
                            timestamp: {
                                [Op.between]: [startOfDay, endOfDay]
                            }
                        }
                    });

                    // Check if user has already checked out
                    const checkOutToday = await Attendance.findOne({
                        where: {
                            userId: user.id,
                            type: AttendanceType.CHECK_OUT,
                            timestamp: {
                                [Op.between]: [startOfDay, endOfDay]
                            }
                        }
                    });

                    // If checked in but not checked out, send reminder
                    if (checkInToday && !checkOutToday) {
                        console.log(`[Scheduler] Checkout reminder for ${user.name} (Shift ends: ${user.Shift.endHour})`);

                        // Send Push Notification
                        await sendPushNotification(
                            [user.id],
                            '⏰ Waktunya Absen Pulang!',
                            `Shift Anda (${user.Shift.name}) akan selesai. Jangan lupa absen pulang!`,
                            { type: 'CHECKOUT_REMINDER', shiftEndTime: user.Shift.endHour }
                        );
                    }
                }
            }
            console.log('[Scheduler] Checkout Reminder Check Completed.');

        } catch (error) {
            console.error('[Scheduler] Error in Checkout Reminder:', error);
        }
    });
};
