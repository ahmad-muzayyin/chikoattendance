import { Request, Response } from 'express';
import { LeaveRequest, LeaveStatus, LeaveType } from '../models/LeaveRequest';
import { User } from '../models/User';
import { Attendance, AttendanceType } from '../models/Attendance';
import { Op } from 'sequelize';

// Employee subset of AuthRequest
interface AuthRequest extends Request {
    user?: { id: number; role: string };
}

// User: Submit leave request
export const submitLeaveRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { type, startDate, endDate, daysCount, reason } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Check if there's already a pending or approved request overlapping these dates
        const existing = await LeaveRequest.findOne({
            where: {
                userId,
                status: { [Op.ne]: LeaveStatus.REJECTED },
                [Op.or]: [
                    {
                        startDate: { [Op.between]: [startDate, endDate] }
                    },
                    {
                        endDate: { [Op.between]: [startDate, endDate] }
                    }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Anda sudah memiliki pengajuan cuti/izin di tanggal tersebut.' });
        }

        const leaveRequest = await LeaveRequest.create({
            userId,
            type,
            startDate,
            endDate,
            daysCount: parseInt(daysCount) || 1,
            reason,
            status: LeaveStatus.PENDING
        });

        res.status(201).json({ message: 'Pengajuan cuti berhasil dikirim. Menunggu persetujuan owner.', data: leaveRequest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan sistem.' });
    }
};

// User: Get their leave history
export const getMyLeaves = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const leaves = await LeaveRequest.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

        res.json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Get all leave requests for management
export const getAllLeaveRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;
        const whereClause: any = {};
        if (status) whereClause.status = status;

        const leaves = await LeaveRequest.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['id', 'name', 'role'] }],
            order: [['createdAt', 'DESC']]
        });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Enrich with monthUsage for each user in the list
        const enrichedLeaves = await Promise.all(leaves.map(async (leave: any) => {
            const usage = await LeaveRequest.sum('daysCount', {
                where: {
                    userId: leave.userId,
                    status: LeaveStatus.APPROVED,
                    startDate: { [Op.gte]: startOfMonth },
                    endDate: { [Op.lte]: endOfMonth }
                }
            });

            return {
                ...leave.toJSON(),
                monthUsage: usage || 0
            };
        }));

        res.json(enrichedLeaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Approve or Reject leave request
export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        const adminId = req.user?.id;

        const leave = await LeaveRequest.findByPk(id);
        if (!leave) return res.status(404).json({ message: 'Pengajuan tidak ditemukan.' });

        leave.status = status;
        leave.approvedBy = adminId || null;
        if (status === LeaveStatus.REJECTED) leave.rejectionReason = rejectionReason;

        await leave.save();

        // If APPROVED, auto-create Attendance records for each day
        if (status === LeaveStatus.APPROVED) {
            const startStr = leave.startDate; // YYYY-MM-DD
            const endStr = leave.endDate;

            const start = new Date(startStr);
            const end = new Date(endStr);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Check if attendance already exists for this day
                const dateOnly = d.toISOString().split('T')[0];
                const dayStart = new Date(`${dateOnly}T00:00:00Z`);
                const dayEnd = new Date(`${dateOnly}T23:59:59Z`);

                const existingAtt = await Attendance.findOne({
                    where: {
                        userId: leave.userId,
                        timestamp: { [Op.between]: [dayStart, dayEnd] }
                    }
                });

                if (!existingAtt) {
                    await Attendance.create({
                        userId: leave.userId,
                        type: leave.type === LeaveType.SICK ? AttendanceType.SICK : AttendanceType.PERMIT,
                        timestamp: new Date(d),
                        notes: `[SISTEM] Disetujui: ${leave.reason}`,
                        latitude: 0,
                        longitude: 0,
                        deviceId: 'SYSTEM_APPROVED_LEAVE'
                    });
                }
            }
        }

        res.json({ message: `Pengajuan berhasil ${status.toLowerCase()}.`, data: leave });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memperbarui status pengajuan.' });
    }
};
