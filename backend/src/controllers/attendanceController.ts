import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Attendance, AttendanceType } from '../models/Attendance';
import { User, UserRole } from '../models/User';
import { Branch } from '../models/Branch';
import { Shift } from '../models/Shift';
import { Punishment } from '../models/Punishment';
import { AuditLog } from '../models/AuditLog';
import { getDistance } from 'geolib';
import { Op } from 'sequelize';

export const checkIn = async (req: AuthRequest, res: Response) => {
    try {
        const { latitude, longitude, deviceId, photoUrl, notes } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Ensure coordinates are numbers
        const lat = parseFloat(latitude);
        const long = parseFloat(longitude);

        if (isNaN(lat) || isNaN(long)) {
            return res.status(400).json({ message: 'Invalid coordinates provided' });
        }

        // Fetch User and Branch (exclude user.Shift, we will detect it dynamically)
        const user = await User.findByPk(userId, { include: [Branch] });

        // Use strict type casting or check
        const userRole = user?.role as UserRole;
        const branch = user?.Branch as Branch | null;

        let visitedBranchName = '';

        // Validation: Regular employees MUST have a branch
        if (!user || (!branch && userRole !== UserRole.HEAD && userRole !== UserRole.OWNER && userRole !== UserRole.SUPERVISOR)) {
            return res.status(400).json({ message: 'User not assigned to a branch' });
        }

        // 1. Geofencing Check
        // SUPERVISOR: Check against ALL branches
        if (userRole === UserRole.SUPERVISOR) {
            const allBranches = await Branch.findAll();
            let isWithinRange = false;
            let nearestDist = Infinity;

            for (const b of allBranches) {
                const dist = getDistance(
                    { latitude: lat, longitude: long },
                    { latitude: b.latitude, longitude: b.longitude }
                );

                if (dist <= (b.radius || 100)) {
                    isWithinRange = true;
                    visitedBranchName = b.name;
                    break; // Found a valid branch
                }
                if (dist < nearestDist) nearestDist = dist;
            }

            if (!isWithinRange) {
                return res.status(400).json({
                    message: 'Anda tidak berada di lokasi outlet manapun.',
                    nearestDistance: nearestDist
                });
            }
        }
        // STAFF/HEAD/OWNER: Check against assigned branch (if enforced)
        else if (userRole !== UserRole.OWNER) {
            if (!branch) {
                return res.status(400).json({ message: 'Data Cabang tidak ditemukan untuk user ini.' });
            }

            const dist = getDistance(
                { latitude: lat, longitude: long },
                { latitude: branch.latitude, longitude: branch.longitude }
            );

            // Use branch radius or default to 100m if not set
            const allowedRadius = branch.radius || 100;

            if (dist > allowedRadius) {
                return res.status(400).json({
                    message: 'Di luar jangkauan outlet/cabang',
                    distance: dist,
                    maxRadius: allowedRadius
                });
            }
            visitedBranchName = branch.name;
        }

        // 2. Check for double check-in
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingCheckIn = await Attendance.findOne({
            where: {
                userId,
                type: AttendanceType.CHECK_IN,
                timestamp: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            }
        });

        if (existingCheckIn) {
            return res.status(400).json({ message: 'Anda sudah melakukan Check-in hari ini.' });
        }

        // 3. Smart Shift Detection Logic & Late Calc
        const now = new Date();
        let isLate = false;
        let isHalfDay = false;
        let warningMessage = '';

        // Get current time in minutes (WIB)
        const nowWIBString = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' });
        const [currentHour, currentMinute] = nowWIBString.split(':').map(Number);
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        // Fetch ALL Shifts to compare
        const allShifts = await Shift.findAll();

        let targetShift = null;
        let minDiff = Infinity;

        // Find the closest shift start time
        for (const s of allShifts) {
            const [sHour, sMinute] = s.startHour.split(':').map(Number);
            const shiftStartMinutes = sHour * 60 + sMinute;

            // Calculate absolute difference
            let diff = Math.abs(currentTotalMinutes - shiftStartMinutes);

            if (diff < minDiff) {
                minDiff = diff;
                targetShift = s;
            }
        }

        // Default or Fallback if no shifts
        const detectedShiftName = targetShift ? targetShift.name : 'Unknown';
        const startHourStr = targetShift ? targetShift.startHour : (branch?.startHour || '09:00');

        console.log(`[SmartShift] User ${user.name} detected on shift: ${detectedShiftName} (${startHourStr}) at ${nowWIBString}`);

        // KEPALA TOKO (HEAD): Flexible time, never late
        if (userRole === UserRole.HEAD) {
            isLate = false;
        } else {
            // Determine shift start time in WIB context
            const [startHour, startMinute] = startHourStr.split(':').map(Number);
            const shiftStartTotalMinutes = startHour * 60 + startMinute;

            // Check if late (compare minutes) with 10 mins tolerance
            const tolerance = 10;

            if (currentTotalMinutes > (shiftStartTotalMinutes + tolerance)) {
                isLate = true;
                const lateDurationMinutes = currentTotalMinutes - shiftStartTotalMinutes;

                // If late > 60 mins (1 hour), mark as Half Day
                if (lateDurationMinutes > 60) {
                    isHalfDay = true;
                }

                try {
                    // Determine penalty points
                    const penaltyPoints = 5;
                    await Punishment.create({
                        userId,
                        points: penaltyPoints,
                        reason: `Terlambat ${Math.floor(lateDurationMinutes)} menit. Shift: ${detectedShiftName} (${startHourStr})`,
                        date: now
                    });

                    // Check total lates this month to trigger Warning
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                    const lateCount = await Attendance.count({
                        where: {
                            userId,
                            type: AttendanceType.CHECK_IN,
                            isLate: true,
                            timestamp: {
                                [Op.between]: [startOfMonth, endOfMonth]
                            }
                        }
                    });

                    if (lateCount + 1 > 5) {
                        warningMessage = `PERINGATAN: Anda terlambat > 5 kali bulan ini (${lateCount + 1}x). Gaji dipotong Rp 50.000.`;
                        console.log(`[NOTIF CAFE] KARYAWAN ${user.name} SUDAH TELAT ${lateCount + 1} KALI.`);
                    }

                } catch (punishmentError) {
                    console.error('Failed to create automatic punishment:', punishmentError);
                }
            }
        }

        // 4. Create Attendance Record
        const attendance = await Attendance.create({
            userId,
            type: AttendanceType.CHECK_IN,
            timestamp: now,
            latitude: lat,
            longitude: long,
            deviceId: deviceId || 'UNKNOWN',
            isLate,
            isOvertime: false,
            isHalfDay,
            notes: notes || (visitedBranchName ? `Visit: ${visitedBranchName}` : '') || (isLate ? `Telat (${detectedShiftName})` : `Hadir (${detectedShiftName})`),
            photoUrl
        });

        // 5. Create Audit Log (Non-blocking)
        AuditLog.create({
            action: 'CHECK_IN',
            performedBy: userId,
            targetId: attendance.id.toString(),
            details: `Check-in success. Shift: ${detectedShiftName}. Late: ${isLate}`
        }).catch(err => console.error('Audit log failed:', err));

        res.status(201).json({
            message: `Check-in Berhasil (Shift: ${detectedShiftName})`,
            data: attendance,
            isLate,
            punishmentPoints: isLate ? 5 : 0,
            warning: warningMessage,
            halfDayInfo: isHalfDay ? 'Anda dianggap masuk setengah hari.' : undefined
        });

    } catch (error: any) {
        console.error('Check-in Error:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan sistem saat check-in',
            error: error.message
        });
    }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
    try {
        const { latitude, longitude, deviceId, isOvertime: isOvertimeClaimed, notes } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findByPk(userId, { include: [Branch] });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const branch = user.Branch as Branch | null;
        const now = new Date();
        let isOvertime = false;

        // Ensure coordinates
        const lat = parseFloat(latitude);
        const long = parseFloat(longitude);
        if (isNaN(lat) || isNaN(long)) {
            return res.status(400).json({ message: 'Invalid coordinates provided' });
        }

        // Location Validation
        const userRole = user.role as UserRole;

        // SUPERVISOR: Check against ALL branches
        if (userRole === UserRole.SUPERVISOR) {
            const allBranches = await Branch.findAll();
            let isWithinRange = false;
            let nearestDist = Infinity;

            for (const b of allBranches) {
                const dist = getDistance(
                    { latitude: lat, longitude: long },
                    { latitude: b.latitude, longitude: b.longitude }
                );

                if (dist <= (b.radius || 100)) {
                    isWithinRange = true;
                    break;
                }
                if (dist < nearestDist) nearestDist = dist;
            }

            if (!isWithinRange) {
                return res.status(400).json({
                    message: 'Anda tidak berada di lokasi outlet manapun.',
                    nearestDistance: nearestDist
                });
            }
        }
        // STAFF/HEAD: Check against assigned branch (OWNER excluded)
        else if (userRole !== UserRole.OWNER) {
            if (!branch) {
                return res.status(400).json({ message: 'Data Cabang tidak ditemukan untuk user ini.' });
            }

            const dist = getDistance(
                { latitude: lat, longitude: long },
                { latitude: branch.latitude, longitude: branch.longitude }
            );

            // Use branch radius or default to 100m
            const allowedRadius = branch.radius || 100;

            if (dist > allowedRadius) {
                return res.status(400).json({
                    message: 'Di luar jangkauan outlet/cabang. Tidak dapat Check-Out.',
                    distance: dist,
                    maxRadius: allowedRadius
                });
            }
        }

        // Validation: Prevent Multiple Check-Outs per Day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingCheckOut = await Attendance.findOne({
            where: {
                userId,
                type: AttendanceType.CHECK_OUT,
                timestamp: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            }
        });

        if (existingCheckOut) {
            return res.status(400).json({ message: 'Anda sudah melakukan Check-out hari ini. Data tidak dapat diubah.' });
        }

        // Validation: Must Have Checked-In Today
        const existingCheckIn = await Attendance.findOne({
            where: {
                userId,
                type: AttendanceType.CHECK_IN,
                timestamp: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            }
        });

        if (!existingCheckIn) {
            return res.status(400).json({ message: 'Anda belum melakukan Absensi Masuk hari ini.' });
        }

        // --- SMART SHIFT DETECTION FOR OVERTIME ---
        // Instead of user.Shift, we identify which shift matched the CheckIn time
        const checkInTime = new Date(existingCheckIn.timestamp);
        const checkInWIBString = checkInTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' });
        const [ciHour, ciMinute] = checkInWIBString.split(':').map(Number);
        const ciTotalMinutes = ciHour * 60 + ciMinute;

        // Fetch All Shifts
        const allShifts = await Shift.findAll();
        let targetShift = null;
        let minDiff = Infinity;

        // Find shift start that is closest to Checked In Time
        for (const s of allShifts) {
            const [sHour, sMinute] = s.startHour.split(':').map(Number);
            const shiftStartMinutes = sHour * 60 + sMinute;

            // Calculate absolute difference
            let diff = Math.abs(ciTotalMinutes - shiftStartMinutes);

            if (diff < minDiff) {
                minDiff = diff;
                targetShift = s;
            }
        }

        const detectedShiftName = targetShift ? targetShift.name : 'Unknown';
        const endHourStr = targetShift ? targetShift.endHour : (branch?.endHour || '17:00');
        console.log(`[SmartShift] Checkout for ${user.name}. Matched Shift: ${detectedShiftName} (Ends ${endHourStr})`);

        // --- OVERTIME LOGIC ---
        // Get current time in WIB
        const nowWIBString = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' });
        const [currentHour, currentMinute] = nowWIBString.split(':').map(Number);

        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const [endH, endM] = endHourStr.split(':').map(Number);
        const shiftEndTotalMinutes = endH * 60 + endM;

        // KEPALA TOKO (HEAD): Overtime if worked > 8 hours
        if (user.role === UserRole.HEAD) {
            const checkInTimeMs = new Date(existingCheckIn.timestamp).getTime();
            const checkOutTimeMs = now.getTime();
            const durationHours = (checkOutTimeMs - checkInTimeMs) / (1000 * 60 * 60);

            if (durationHours > 8) {
                isOvertime = true;
            }
        }
        else {
            // STAFF: Overtime only if check-out > 3 hours AFTER detected shift end time
            const diffMinutes = currentTotalMinutes - shiftEndTotalMinutes;

            if (diffMinutes > 180) { // 3 hours
                isOvertime = true;
            }
        }

        const attendance = await Attendance.create({
            userId,
            type: AttendanceType.CHECK_OUT,
            timestamp: now,
            latitude,
            longitude,
            deviceId,
            isLate: false,
            isOvertime,
            isHalfDay: false,
            notes: notes || (isOvertime ? `Lembur (${detectedShiftName})` : `Pulang (${detectedShiftName})`)
        });

        res.status(201).json({
            message: 'Check-out successful',
            data: attendance,
            isOvertime: isOvertime ? 'Anda tercatat Lembur hari ini.' : undefined
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get calendar data for attendance screen
export const getCalendar = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Get all check-ins for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const attendances = await Attendance.findAll({
            where: {
                userId,
                // type: AttendanceType.CHECK_IN, // <-- REMOVED restriction
                type: {
                    [Op.or]: [AttendanceType.CHECK_IN, AttendanceType.PERMIT, AttendanceType.SICK]
                },
                timestamp: {
                    [Op.gte]: startOfMonth,
                    [Op.lte]: endOfMonth
                }
            },
            order: [['timestamp', 'ASC']]
        });

        // Format data for calendar
        const calendarData = attendances.map(att => {
            const date = new Date(att.timestamp);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

            let status = 'onTime';
            // Force WIB Timezone for Display
            let timeStr = date.toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            let notes = att.notes;

            if (att.type === AttendanceType.CHECK_IN) {
                if (att.isLate) status = 'late';
                if (!notes) notes = att.isLate ? 'Terlambat' : 'Tepat Waktu';
            } else if (att.type === AttendanceType.PERMIT) {
                status = 'off';
                timeStr = '-'; // No time for permit
                if (!notes) notes = 'Izin (Cuti/Keperluan)';
            } else if (att.type === AttendanceType.SICK) {
                status = 'off';
                timeStr = '-';
                if (!notes) notes = 'Sakit';
            }

            return {
                date: dateStr,
                status,
                time: timeStr,
                isHalfDay: att.isHalfDay || false,
                isLate: att.isLate,
                notes: notes
            };
        });

        res.json(calendarData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get recap data
export const getRecap = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Get data for last 6 months
        const recapData = [];
        const now = new Date();

        for (let i = 0; i < 6; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

            // Fetch all relevant records for the month
            const attendances = await Attendance.findAll({
                where: {
                    userId,
                    timestamp: {
                        [Op.gte]: startOfMonth,
                        [Op.lte]: endOfMonth
                    }
                }
            });

            // Group by Date for accurate status determination
            const dailyStatus: Record<string, { hasCheckIn: boolean; isLate: boolean; hasAlpha: boolean; hasPermit: boolean; hasSick: boolean; autoAlpha: boolean }> = {};

            attendances.forEach(att => {
                const dateStr = new Date(att.timestamp).toISOString().split('T')[0];
                if (!dailyStatus[dateStr]) {
                    dailyStatus[dateStr] = {
                        hasCheckIn: false,
                        isLate: false,
                        hasAlpha: false,
                        hasPermit: false,
                        hasSick: false,
                        autoAlpha: false
                    };
                }

                if (att.type === AttendanceType.CHECK_IN) {
                    dailyStatus[dateStr].hasCheckIn = true;
                    if (att.isLate) dailyStatus[dateStr].isLate = true;
                } else if (att.type === AttendanceType.ALPHA) {
                    dailyStatus[dateStr].hasAlpha = true;
                } else if (att.type === AttendanceType.PERMIT) {
                    dailyStatus[dateStr].hasPermit = true;
                } else if (att.type === AttendanceType.SICK) {
                    dailyStatus[dateStr].hasSick = true;
                } else if (att.type === AttendanceType.CHECK_OUT) {
                    // Check for Auto-Alpha (CheckOut at 23:55)
                    const d = new Date(att.timestamp);
                    // Force WIB check or simple hour/minute check (assuming server time is consistent with recording)
                    // In DB timestamp is usually UTC. We should rely on stored time. 
                    // However, for robustness, checking 23:55 local time (server time)
                    // If we assume the app sent 23:55 local, and DB stores precise time.
                    // Let's use getHours/getMinutes which uses server local time or UTC depending on config.
                    // Better validation:
                    if (d.getHours() === 23 && d.getMinutes() === 55) {
                        dailyStatus[dateStr].autoAlpha = true;
                    }
                }
            });

            let onTime = 0;
            let late = 0;
            let off = 0;
            let alpha = 0;

            Object.values(dailyStatus).forEach(day => {
                if (day.hasAlpha) {
                    alpha++;
                } else if (day.autoAlpha && !day.hasCheckIn) {
                    // Implicit Alpha: Checkout at 23:55 without CheckIn
                    alpha++;
                } else if (day.hasPermit || day.hasSick) {
                    off++;
                } else if (day.hasCheckIn) {
                    if (day.isLate) late++;
                    else onTime++;
                }
            });

            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

            recapData.push({
                month: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
                monthCode: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
                onTime,
                late,
                off,
                holiday: 0,
                alpha
            });
        }

        res.json(recapData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get points and punishments
export const getPoints = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const punishments = await Punishment.findAll({
            where: { userId },
            order: [['date', 'DESC']],
            limit: 20
        });

        const totalPoints = punishments.reduce((sum, p) => sum + p.points, 0);

        const formattedPunishments = punishments.map(p => ({
            reason: p.reason,
            pointsDeducted: p.points,
            date: p.date
        }));

        res.json({
            totalPoints,
            punishments: formattedPunishments
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get dashboard stats for current month
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const attendances = await Attendance.findAll({
            where: {
                userId,
                timestamp: {
                    [Op.gte]: startOfMonth,
                    [Op.lte]: endOfMonth
                }
            },
            attributes: ['type', 'isLate']
        });

        const stats = {
            hadir: attendances.filter(a => a.type === AttendanceType.CHECK_IN && !a.isLate).length,
            telat: attendances.filter(a => a.isLate && a.type === AttendanceType.CHECK_IN).length,
            lembur: attendances.filter(a => a.isOvertime).length,
            izin: attendances.filter(a => a.type === AttendanceType.PERMIT || a.type === AttendanceType.SICK).length,
            alpha: attendances.filter(a => a.type === AttendanceType.ALPHA).length
        };

        res.json(stats);

    } catch (error) {
        console.error('Get Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Submit Permit (Izin/Sakit)
export const submitPermit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { date, type, reason } = req.body; // type: 'PERMIT' or 'SICK'

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Validate date
        const permitDate = new Date(date);

        // Check if attendance already exists
        const existing = await Attendance.findOne({
            where: {
                userId,
                timestamp: {
                    [Op.between]: [
                        new Date(permitDate.setHours(0, 0, 0, 0)),
                        new Date(permitDate.setHours(23, 59, 59, 999))
                    ]
                }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Absensi/Izin untuk tanggal ini sudah ada.' });
        }

        const attendanceType = type === 'SICK' ? AttendanceType.SICK : AttendanceType.PERMIT;

        const attendance = await Attendance.create({
            userId,
            type: attendanceType,
            timestamp: new Date(date), // Use provided date
            latitude: 0,
            longitude: 0,
            deviceId: 'PERMIT_REQUEST',
            isLate: false,
            isOvertime: false,
            isHalfDay: false,
            notes: reason
        });

        // Fetch user for name
        const RequestingUser = await User.findByPk(userId);
        const userName = RequestingUser?.name || 'Karyawan';

        // Send Real Notification to Superior
        const { notifySuperior } = require('../utils/notifications');
        await notifySuperior(
            userId, // Sender ID
            'Pengajuan Izin Masuk',
            `${userName} mengajukan ${type} pada ${date}. Alasan: ${reason}`,
            { type: 'PERMIT_REQUEST', id: attendance.id }
        );

        // Notify Requesting User (Confirmation)
        const { sendPushNotification } = require('../utils/notifications');
        await sendPushNotification(
            [userId],
            'Pengajuan Izin Terkirim',
            `Pengajuan ${type} untuk tanggal ${date} berhasil dikirim. Menunggu persetujuan.`,
            { type: 'SUCCESS' }
        );

        res.status(201).json({
            message: 'Pengajuan izin berhasil dikirim.',
            data: attendance
        });

    } catch (error) {
        console.error('Submit Permit Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel Permit
export const cancelPermit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { date } = req.params; // Get date from params YYYY-MM-DD

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const permitDate = new Date(date);

        const attendance = await Attendance.findOne({
            where: {
                userId,
                timestamp: {
                    [Op.between]: [
                        new Date(permitDate.setHours(0, 0, 0, 0)),
                        new Date(permitDate.setHours(23, 59, 59, 999))
                    ]
                },
                type: {
                    [Op.or]: [AttendanceType.PERMIT, AttendanceType.SICK]
                }
            }
        });

        if (!attendance) {
            return res.status(404).json({ message: 'Data izin tidak ditemukan untuk tanggal tersebut.' });
        }

        // Logic Check: Allow cancellation only if date is today or future?
        // Or if status is not 'APPROVED' (if we had status).
        // For now, allow cancellation anytime as per request.

        await attendance.destroy();

        // Fetch user for name logic
        const RequestingUser = await User.findByPk(userId);
        const userName = RequestingUser?.name || 'Karyawan';

        // Notify Superior of Cancellation
        const { notifySuperior, sendPushNotification } = require('../utils/notifications');
        await notifySuperior(
            userId,
            'Pembatalan Izin',
            `${userName} membatalkan pengajuan izin untuk tanggal ${date}.`,
            { type: 'PERMIT_CANCEL', date: date }
        );

        // Notify User
        await sendPushNotification(
            [userId],
            'Izin Dibatalkan',
            `Pengajuan izin untuk tanggal ${date} telah dibatalkan.`,
            { type: 'INFO' }
        );

        res.json({ message: 'Pengajuan izin berhasil dibatalkan.' });

    } catch (error) {
        console.error('Cancel Permit Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get detailed attendance history for a specific month
export const getMonthlyHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { month } = req.query; // Format: YYYY-MM

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!month || typeof month !== 'string') return res.status(400).json({ message: 'Month parameter needed (YYYY-MM)' });

        const [year, monthNum] = month.split('-').map(Number);
        const startOfMonth = new Date(year, monthNum - 1, 1);
        const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

        const attendances = await Attendance.findAll({
            where: {
                userId,
                timestamp: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            },
            order: [['timestamp', 'ASC']]
        });

        // Group by Date
        const grouped: any = {};

        attendances.forEach(att => {
            const dateStr = new Date(att.timestamp).toISOString().split('T')[0];
            if (!grouped[dateStr]) {
                grouped[dateStr] = {
                    date: dateStr,
                    checkIn: null,
                    checkOut: null,
                    events: []
                };
            }

            // Simplified summary
            if (att.type === AttendanceType.CHECK_IN) {
                grouped[dateStr].checkIn = att;
            } else if (att.type === AttendanceType.CHECK_OUT) {
                grouped[dateStr].checkOut = att;
            }

            // Keep all raw events just in case
            grouped[dateStr].events.push(att);
        });

        // Convert object to array sorted by date descending
        const history = Object.values(grouped).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Validate Work Duration for HEAD (Kepala Toko)
        // Must work at least 8 hours
        if (req.user?.role === UserRole.HEAD) {
            history.forEach((record: any) => {
                if (record.checkIn && record.checkOut) {
                    const start = new Date(record.checkIn.timestamp).getTime();
                    const end = new Date(record.checkOut.timestamp).getTime();

                    const durationHours = (end - start) / (1000 * 60 * 60);

                    if (durationHours < 7.9) { // Tolerance for small ms discrepancies
                        const msg = `Durasi Kurang 8 jam (${durationHours.toFixed(1)}jam)`;

                        // Append to check-out notes for visibility
                        if (record.checkOut) {
                            record.checkOut.notes = record.checkOut.notes
                                ? `${record.checkOut.notes} | ${msg}`
                                : msg;
                        }
                    }
                }
            });
        }

        res.json(history);

    } catch (error) {
        console.error('Get Monthly History Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Leaderboard Data
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { month, year } = req.query;
        const now = new Date();
        const currentYear = year ? parseInt(year as string) : now.getFullYear();
        const currentMonth = month ? parseInt(month as string) : now.getMonth() + 1; // 1-12

        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // Fetch all branches with their employees
        const branches = await Branch.findAll({
            include: [{
                model: User,
                attributes: ['id', 'name', 'role', 'profile_picture'],
                where: {
                    role: { [Op.notIn]: [UserRole.OWNER, UserRole.SUPERVISOR] } // Exclude Owners/Supervisors
                },
                required: false
            }]
        });

        const result = [];

        for (const branch of branches) {
            const employees = (branch as any).Users || [];
            if (employees.length === 0) continue;

            const branchStats = [];

            for (const emp of employees) {
                const attendances = await Attendance.findAll({
                    where: {
                        userId: emp.id,
                        type: AttendanceType.CHECK_IN,
                        timestamp: {
                            [Op.between]: [startOfMonth, endOfMonth]
                        }
                    }
                });

                const presentCount = attendances.length;
                const lateCount = attendances.filter(a => a.isLate).length;

                // Scoring: Present (+10), Late Penalty (-5)
                // Net for late day: 10 - 5 = 5 pts
                // Net for on-time day: 10 pts
                const finalScore = (presentCount * 10) - (lateCount * 5);

                const latePercentage = presentCount > 0 ? (lateCount / presentCount) * 100 : 0;

                branchStats.push({
                    id: emp.id,
                    name: emp.name,
                    photo: emp.profile_picture,
                    present: presentCount,
                    late: lateCount,
                    score: finalScore,
                    latePercentage
                });
            }

            // FILTER: Only show people with at least 1 attendance for 'Best'
            const activeStaff = branchStats.filter(s => s.present > 0);

            // Best: Highest Score
            const best = [...activeStaff].sort((a, b) => b.score - a.score).slice(0, 3);

            // Worst: Lowest Score (but maybe prioritize Late Count?)
            // Let's sort by 'Most Late' primarily for 'Worst' category
            const worst = [...activeStaff].sort((a, b) => b.late - a.late).slice(0, 3);

            result.push({
                branchName: branch.name,
                best: best,
                worst: worst
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Get Leaderboard Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
