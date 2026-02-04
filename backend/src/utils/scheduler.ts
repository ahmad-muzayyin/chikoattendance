import cron from 'node-cron';
import { User, UserRole } from '../models/User';
import { Attendance, AttendanceType } from '../models/Attendance';
import { Punishment } from '../models/Punishment';
import { Op } from 'sequelize';
import { sendPushNotification } from './notifications';

export const initScheduler = () => {
    console.log('[Scheduler] Initialized:');
    console.log('  - Alpha checker: 23:55 daily');
    console.log('  - Attendance Checks (Checkout/Overtime): Every 5 min');

    // Run every day at 23:55 (11:55 PM)
    cron.schedule('55 23 * * *', async () => {
        console.log('[Scheduler] Running Daily Alpha Check...');
        try {
            const now = new Date();
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));

            // 1. Get All Active Employees (Exclude OWNER)
            const users = await User.findAll({
                where: {
                    role: {
                        [Op.notIn]: [UserRole.OWNER]
                    }
                }
            });

            for (const user of users) {
                // 2. Get all attendance records for today
                const todayAttendances = await Attendance.findAll({
                    where: {
                        userId: user.id,
                        timestamp: {
                            [Op.between]: [startOfDay, endOfDay]
                        }
                    }
                });

                const hasCheckIn = todayAttendances.some(a => a.type === AttendanceType.CHECK_IN);
                const hasCheckOut = todayAttendances.some(a => a.type === AttendanceType.CHECK_OUT);
                // Check if they already have Permit/Sick/Alpha to avoid double penalizing
                const hasSpecialStatus = todayAttendances.some(a =>
                    [AttendanceType.PERMIT, AttendanceType.SICK, AttendanceType.ALPHA].includes(a.type)
                );

                if (hasSpecialStatus) continue;

                // Scenario A: No Attendance at all -> ALPHA
                if (!hasCheckIn) {
                    console.log(`[Scheduler] Marking ALPHA (No Show) for User: ${user.name} (${user.id})`);

                    await Attendance.create({
                        userId: user.id,
                        type: AttendanceType.ALPHA,
                        timestamp: new Date(),
                        latitude: 0,
                        longitude: 0,
                        deviceId: 'SYSTEM_SCHEDULER',
                        isLate: false,
                        isOvertime: false,
                        isHalfDay: false,
                        notes: 'Tidak Absen (Auto Alpha)'
                    });

                    // Punishment for No Show
                    await Punishment.create({
                        userId: user.id,
                        points: 20,
                        reason: 'Alpha (Tidak Masuk Tanpa Keterangan)',
                        date: new Date()
                    });

                    await sendPushNotification(
                        [user.id],
                        'Terhitung Alpha',
                        'Anda tidak melakukan absensi hari ini. Sistem mencatat sebagai Alpha (-20 Poin).',
                        { type: 'ALPHA_ALERT' }
                    );
                }
                // Scenario B: Checked In but Forgot Checkout -> INVALID (Treat as ALPHA but lighter penalty)
                else if (hasCheckIn && !hasCheckOut) {
                    console.log(`[Scheduler] Marking ALPHA (No Checkout) for User: ${user.name} (${user.id})`);

                    // Create ALPHA record to invalidate the day
                    await Attendance.create({
                        userId: user.id,
                        type: AttendanceType.ALPHA,
                        timestamp: new Date(),
                        latitude: 0,
                        longitude: 0,
                        deviceId: 'SYSTEM_SCHEDULER',
                        isLate: false,
                        isOvertime: false,
                        isHalfDay: false,
                        notes: 'Lupa Check-out (Dianggap Alpha)'
                    });

                    // Punishment for Forgetting Checkout: ONLY 2 POINTS
                    await Punishment.create({
                        userId: user.id,
                        points: 2,
                        reason: 'Lupa Check-out (Sanksi Ringan)',
                        date: new Date()
                    });

                    await sendPushNotification(
                        [user.id],
                        'Lupa Check-out',
                        'Anda lupa Check-out hari ini. Kehadiran dianggap tidak sah & sanksi -2 Poin.',
                        { type: 'CHECKOUT_ALERT' }
                    );
                }
            }
            console.log('[Scheduler] Alpha Check Completed.');

        } catch (error) {
            console.error('[Scheduler] Error in Alpha Check:', error);
        }
    });

    // Run every 5 minutes - Checkout Reminder & Overtime Prompt
    cron.schedule('*/5 * * * *', async () => {
        console.log('[Scheduler] Running Attendance Checks...');
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));

            // Import Shift/Branch model locally to avoid circular deps if any, 
            // though standard import is fine.
            const { Shift } = require('../models/Shift');
            const { Branch } = require('../models/Branch');

            const users = await User.findAll({
                where: {
                    role: {
                        [Op.notIn]: [UserRole.OWNER]
                    }
                },
                include: [{
                    model: Shift,
                    required: false
                }, {
                    model: Branch,
                    required: false
                }]
            });

            for (const user of users) {
                // Determine user shift end time
                // Fallback to branch setting if shift is missing, or default 17:00
                const endHourStr = user.Shift?.endHour || user.Branch?.endHour || '17:00';

                const [endHour, endMinute] = endHourStr.split(':').map(Number);

                const shiftEndMinutes = endHour * 60 + endMinute;
                const currentMinutes = currentHour * 60 + currentMinute;
                const timeDiff = currentMinutes - shiftEndMinutes;

                // 1. CHECKOUT REMINDER (Waktunya Pulang)
                // Window: 0 to 5 minutes after shift ends (Exact Time)
                if (timeDiff >= 0 && timeDiff <= 5) {
                    const checkCheckOut = await Attendance.findOne({
                        where: { userId: user.id, type: AttendanceType.CHECK_OUT, timestamp: { [Op.between]: [startOfDay, endOfDay] } }
                    });

                    const checkCheckIn = await Attendance.findOne({
                        where: { userId: user.id, type: AttendanceType.CHECK_IN, timestamp: { [Op.between]: [startOfDay, endOfDay] } }
                    });

                    // If working (Checked In, Not Checked Out)
                    if (checkCheckIn && !checkCheckOut) {
                        await sendPushNotification(
                            [user.id],
                            'Sudah Waktunya Pulang!',
                            `Jam kerja Anda sudah berakhir (${endHourStr}). Silakan Check-out sekarang.`,
                            { type: 'CHECKOUT_REMINDER' }
                        );
                        console.log(`[Scheduler] Sent Checkout Reminder to ${user.name}`);
                    }
                }

                // 2. OVERTIME PROMPT (3 Hours Overtime)
                // Window: 180 to 185 minutes (3 hours after = 180 mins)
                const threeHoursInMinutes = 180;
                if (timeDiff >= threeHoursInMinutes && timeDiff <= (threeHoursInMinutes + 5)) {
                    const checkCheckOut = await Attendance.findOne({
                        where: { userId: user.id, type: AttendanceType.CHECK_OUT, timestamp: { [Op.between]: [startOfDay, endOfDay] } }
                    });
                    const checkCheckIn = await Attendance.findOne({
                        where: { userId: user.id, type: AttendanceType.CHECK_IN, timestamp: { [Op.between]: [startOfDay, endOfDay] } }
                    });

                    // If STILL working 3 hours after shift
                    if (checkCheckIn && !checkCheckOut) {
                        await sendPushNotification(
                            [user.id],
                            'Apakah Anda Lembur?',
                            `Anda belum absen pulang 3 jam setelah jadwal. Buka aplikasi untuk konfirmasi lembur.`,
                            { type: 'OVERTIME_PROMPT' }
                        );
                        console.log(`[Scheduler] Sent Overtime Prompt to ${user.name}`);
                    }
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error in Attendance Checks:', error);
        }
    });
};
