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
    console.log('  - Morning Reminder: 06:50 WIB');
    console.log('  - Afternoon Reminder: 13:50 WIB');

    // 0. Morning Reminder (06:50 WIB)
    cron.schedule('50 6 * * *', async () => {
        console.log('[Scheduler] Running Morning Reminder (06:50 WIB)...');
        try {
            const users = await User.findAll({
                where: { role: { [Op.notIn]: [UserRole.OWNER] } },
                attributes: ['id', 'pushToken']
            });

            const userIds = users.filter(u => u.pushToken).map(u => u.id);
            if (userIds.length > 0) {
                await sendPushNotification(
                    userIds,
                    'Selamat Pagi! ☀️',
                    'Jangan lupa lakukan Absensi Masuk sebelum mulai bekerja hari ini.',
                    { type: 'REMINDER_MORNING' }
                );
                console.log(`[Scheduler] Sent Morning Reminder to ${userIds.length} users.`);
            }
        } catch (error) {
            console.error('[Scheduler] Error Morning Reminder:', error);
        }
    }, {
        timezone: "Asia/Jakarta"
    });

    // 0.5 Afternoon/Late Check-in Reminder (13:50 WIB)
    cron.schedule('50 13 * * *', async () => {
        console.log('[Scheduler] Running Afternoon Check-in Reminder (13:50 WIB)...');
        try {
            const now = new Date();

            // Calculate Start of Day Jakarta (00:00 WIB Today)
            const startOfTodayJakarta = new Date(now);
            startOfTodayJakarta.setHours(startOfTodayJakarta.getHours() + 7); // Shift generic hours to "Jakarta View"
            startOfTodayJakarta.setUTCHours(0, 0, 0, 0); // Reset to midnight UTC... wait, logic is tricky with date objects.

            // Safer Calculation for 00:00 WIB in UTC
            // 00:00 WIB = 17:00 UTC (Previous Day). 
            // We are currently at 13:50 WIB (06:50 UTC). 
            // Time since 00:00 WIB = 13h 50m.
            // So simply subtract 14 hours from 'now' to be safely inside "Yesterday UTC" / "Today Start WIB"

            const safeStartThreshold = new Date(now.getTime() - (14 * 60 * 60 * 1000));

            // Get all active users
            const users = await User.findAll({
                where: { role: { [Op.notIn]: [UserRole.OWNER] } }
            });

            const userIdsToSend: number[] = [];

            for (const user of users) {
                const hasCheckIn = await Attendance.findOne({
                    where: {
                        userId: user.id,
                        type: AttendanceType.CHECK_IN,
                        timestamp: {
                            [Op.gte]: safeStartThreshold
                        }
                    }
                });

                // If NO check-in found since today started
                if (!hasCheckIn) {
                    userIdsToSend.push(user.id);
                }
            }

            if (userIdsToSend.length > 0) {
                await sendPushNotification(
                    userIdsToSend,
                    'Belum Absen? ⚠️',
                    'Sistem mencatat Anda belum Check-in hari ini. Jika Anda Shift Siang, jangan lupa absen sekarang!',
                    { type: 'REMINDER_AFTERNOON' }
                );
                console.log(`[Scheduler] Sent Afternoon Reminder to ${userIdsToSend.length} users.`);
            }

        } catch (error) {
            console.error('[Scheduler] Error Afternoon Reminder:', error);
        }
    }, {
        timezone: "Asia/Jakarta"
    });

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
        console.log('[Scheduler] Running Attendance Checks (Smart Shift)...');
        try {
            const now = new Date();
            // Start/End day in UTC/Server time for query consistency
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            // Import necessary models locally if needed or rely on top imports
            const { Shift } = require('../models/Shift'); // Ensure these are loaded

            // Get all active users
            const users = await User.findAll({
                where: {
                    role: { [Op.notIn]: [UserRole.OWNER] }
                }
            });

            // Fetch ALL Shifts once to optimize
            const allShifts = await Shift.findAll();

            for (const user of users) {
                // 1. Get Today's Check-In
                const checkInRecord = await Attendance.findOne({
                    where: {
                        userId: user.id,
                        type: AttendanceType.CHECK_IN,
                        timestamp: { [Op.between]: [startOfDay, endOfDay] }
                    }
                });

                // If user hasn't checked in, we cannot determine their dynamic shift, so skip reminders
                if (!checkInRecord) continue;

                // 2. Detect Shift based on Check-In Time (Smart Shift Logic)
                // Assuming timestamp is in UTC, we convert to Jakarta to match shift hours like 08:00
                const checkInTime = new Date(checkInRecord.timestamp);
                const checkInWIBString = checkInTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' });
                const [ciHour, ciMinute] = checkInWIBString.split(':').map(Number);
                const ciTotalMinutes = ciHour * 60 + ciMinute;

                let targetShift: any = null;
                let minDiff = Infinity;

                for (const s of allShifts) {
                    const [sHour, sMinute] = s.startHour.split(':').map(Number);
                    const shiftStartMinutes = sHour * 60 + sMinute;
                    const diff = Math.abs(ciTotalMinutes - shiftStartMinutes);

                    if (diff < minDiff) {
                        minDiff = diff;
                        targetShift = s;
                    }
                }

                // Default if no shift found
                if (!targetShift) continue;

                // 3. Determine Shift End Time from Dynamic Shift
                const endHourStr = targetShift.endHour;
                const [endH, endM] = endHourStr.split(':').map(Number);
                const shiftEndMinutes = endH * 60 + endM;

                // Calculate Current Time in WIB
                const nowWIBString = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' });
                const [currH, currM] = nowWIBString.split(':').map(Number);
                const currentTotalMinutes = currH * 60 + currM;

                const timeDiff = currentTotalMinutes - shiftEndMinutes;

                // Check if already checked out
                const checkOutRecord = await Attendance.findOne({
                    where: {
                        userId: user.id,
                        type: AttendanceType.CHECK_OUT,
                        timestamp: { [Op.between]: [startOfDay, endOfDay] }
                    }
                });

                // Only proceed if NOT checked out
                if (!checkOutRecord) {
                    // A. CHECKOUT REMINDER: 0 to 5 minutes after shift ends
                    // Example: Ends 17:00. Now 17:02. Diff = 2.
                    if (timeDiff >= 0 && timeDiff <= 5) {
                        await sendPushNotification(
                            [user.id],
                            'Waktunya Pulang! 🏠',
                            `Shift ${targetShift.name} Anda berakhir (${endHourStr}). Jangan lupa Check-out ya!`,
                            { type: 'CHECKOUT_REMINDER', shift: targetShift.name }
                        );
                        console.log(`[Scheduler] Sent Checkout Reminder to ${user.name} (Shift: ${targetShift.name})`);
                    }

                    // B. OVERTIME PROMPT: 180 to 185 minutes (~3 hours) after shift ends
                    // Logic: > 3 hours late = Potential Overtime claim
                    const threeHours = 180;
                    if (timeDiff >= threeHours && timeDiff <= (threeHours + 5)) {
                        await sendPushNotification(
                            [user.id],
                            'Lembur? ⏳',
                            `Anda belum check-out 3 jam setelah jam pulang. Klik untuk klaim lembur jika masih bekerja.`,
                            { type: 'OVERTIME_PROMPT' }
                        );
                        console.log(`[Scheduler] Sent Overtime Prompt to ${user.name} (Shift: ${targetShift.name})`);
                    }
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error in Attendance Checks:', error);
        }
    });
};
