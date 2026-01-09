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

        const user = await User.findByPk(userId, { include: [Branch, Shift] });

        // Use strict type casting or check
        const userRole = user?.role as UserRole;
        const branch = user?.Branch as Branch | null;
        const shift = user?.Shift as Shift | null;

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
        else if (userRole !== UserRole.HEAD && userRole !== UserRole.OWNER) {
            if (!branch) {
                return res.status(400).json({ message: 'Data Cabang tidak ditemukan untuk user ini.' });
            }

            const dist = getDistance(
                { latitude: lat, longitude: long },
                { latitude: branch.latitude, longitude: branch.longitude }
            );

            // Use branch radius or default to 50m if not set
            const allowedRadius = branch.radius || 50;

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

        // 3. Late Logic
        const now = new Date();
        let isLate = false;
        let isHalfDay = false;
        let warningMessage = '';

        // KEPALA TOKO (HEAD): Flexible time, never late
        if (userRole === UserRole.HEAD) {
            isLate = false;
        } else {
            // Determine shift start time in WIB context
            const startHourStr = shift?.startHour || branch?.startHour || '09:00';
            const [startHour, startMinute] = startHourStr.split(':').map(Number);

            // Get current time in WIB
            const nowWIBString = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' });
            const [currentHour, currentMinute] = nowWIBString.split(':').map(Number);

            const currentTotalMinutes = currentHour * 60 + currentMinute;
            const shiftStartTotalMinutes = startHour * 60 + startMinute;

            // Check if late (compare minutes)
            if (currentTotalMinutes > shiftStartTotalMinutes) {
                isLate = true;
                // Calculate late duration in minutes
                const lateDurationMinutes = currentTotalMinutes - shiftStartTotalMinutes;

                // If late > 60 mins (1 hour), mark as Half Day
                if (lateDurationMinutes > 60) {
                    isHalfDay = true;
                }

                try {
                    // Determine penalty
                    const penaltyPoints = 5;
                    await Punishment.create({
                        userId,
                        points: penaltyPoints,
                        reason: `Terlambat ${Math.floor(lateDurationMinutes)} menit. Jadwal: ${branch?.startHour || '09:00'}`,
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

                    // currentLateCount matches (lateCount before this insert) + 1? 
                    // We create attendance AFTER this block. So lateCount is N. This will be N+1.
                    // Requirement: "jika lebih dari 5 hari maka akan ada tulisan... pengurangan gaji 50K"
                    // So if (lateCount + 1) > 5.
                    if (lateCount + 1 > 5) {
                        warningMessage = `PERINGATAN: Anda terlambat > 5 kali bulan ini (${lateCount + 1}x). Gaji dipotong Rp 50.000.`;
                        // Log for "Notification to Kepala Toko"
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
            notes: notes || (visitedBranchName ? `Visit: ${visitedBranchName}` : '') || (isLate ? 'Terlambat' : ''),
            photoUrl
        });

        // 5. Create Audit Log (Non-blocking)
        AuditLog.create({
            action: 'CHECK_IN',
            performedBy: userId,
            targetId: attendance.id.toString(),
            details: `Check-in success. Late: ${isLate}`
        }).catch(err => console.error('Audit log failed:', err));

        res.status(201).json({
            message: 'Check-in Berhasil',
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
        const { latitude, longitude, deviceId } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findByPk(userId, { include: [Branch, Shift] });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const branch = user.Branch as Branch | null;
        const shift = user.Shift as Shift | null;
        const now = new Date();
        let isOvertime = false;

        // KEPALA TOKO (HEAD): Overtime if worked > 8 hours
        if (user.role === UserRole.HEAD) {
            // Find today's Check-In
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const checkInRecord = await Attendance.findOne({
                where: {
                    userId,
                    type: AttendanceType.CHECK_IN,
                    timestamp: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    }
                }
            });

            if (checkInRecord) {
                const checkInTime = new Date(checkInRecord.timestamp).getTime();
                const checkOutTime = now.getTime();
                const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

                // If duration > 8 hours, it is overtime
                if (durationHours > 8) {
                    isOvertime = true;
                }
            }
        } else {
            // STAFF/OTHERS: Overtime if checkout > 3 hours after shift end
            // Determine shift end time in WIB
            const endHourStr = shift?.endHour || branch?.endHour || '17:00';
            const [endHour, endMinute] = endHourStr.split(':').map(Number);

            // Get current time in WIB
            const nowWIBString = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' });
            const [currentHour, currentMinute] = nowWIBString.split(':').map(Number);

            const currentTotalMinutes = currentHour * 60 + currentMinute;
            let shiftEndTotalMinutes = endHour * 60 + endMinute;

            // Handle shift crossing midnight (e.g. ends 02:00) -> logic complex, assuming day shift for now
            // If current < shiftEnd, maybe next day? Ignoring for simple MVP.

            // Logic: "melebihi 3 jam dari jam pulang maka itu terhitung lembur"
            const diffMinutes = currentTotalMinutes - shiftEndTotalMinutes;

            if (diffMinutes > 180) {
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
            notes: isOvertime ? 'Lembur' : ''
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

            const attendances = await Attendance.findAll({
                where: {
                    userId,
                    type: AttendanceType.CHECK_IN,
                    timestamp: {
                        [Op.gte]: startOfMonth,
                        [Op.lte]: endOfMonth
                    }
                }
            });

            const onTime = attendances.filter(a => !a.isLate).length;
            const late = attendances.filter(a => a.isLate).length;

            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

            recapData.push({
                month: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
                monthCode: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
                onTime,
                late,
                off: 0, // You can add logic for off days
                holiday: 0 // You can add logic for holidays
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
