// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\controllers\adminController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { Attendance } from '../models/Attendance';
import { Punishment } from '../models/Punishment';
import { Branch } from '../models/Branch';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

// Get all employees with attendance stats for current month
export const getEmployees = async (req: Request, res: Response) => {
    try {
        const authReq = req as any;
        const whereClause: any = {};

        // Scope for HEAD - fetch branchId from DB since it's not in JWT token
        if (authReq.user && authReq.user.role === 'HEAD') {
            const requestingUser = await User.findByPk(authReq.user.id, {
                attributes: ['branchId', 'name', 'role']
            });

            console.log('🔍 HEAD user:', authReq.user.id, requestingUser?.toJSON());

            if (requestingUser && requestingUser.branchId) {
                whereClause.branchId = requestingUser.branchId;
                // HEAD cannot see OWNER users (hierarchy restriction)
                whereClause.role = { [Op.ne]: 'OWNER' };
                console.log('✅ Setting branchId filter:', requestingUser.branchId);
                console.log('✅ Excluding OWNER role from results');
            } else {
                // HEAD user without branch assignment - return empty
                console.log('⚠️ HEAD has no branchId');
                return res.json([]);
            }
        }

        console.log('🔍 Query whereClause:', whereClause);

        const users = await User.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'email', 'role', 'branchId', 'profile_picture', 'position'],
            include: [{ model: Branch, attributes: ['id', 'name'] }],
            order: [['role', 'ASC'], ['name', 'ASC']]
        });

        console.log('🔍 Found', users.length, 'users');

        // Get stats for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const attendances = await Attendance.findAll({
            where: {
                timestamp: {
                    [Op.between]: [startOfMonth, endOfMonth]
                },
                type: 'CHECK_IN'
            },
            attributes: ['userId', 'type', 'isLate']
        });

        // Map stats to users
        const usersWithStats = users.map((user: any) => {
            const userAttendances = attendances.filter((a: any) => a.userId === user.id);
            const stats = {
                hadir: userAttendances.length,
                telat: userAttendances.filter((a: any) => a.isLate).length,
                izin: 0,
                alpha: 0
            };

            return {
                ...user.toJSON(),
                stats
            };
        });

        console.log('✅ Returning', usersWithStats.length, 'users');

        res.json(usersWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get monthly recap for a specific employee
export const getEmployeeAttendance = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query; // optional, default current

        const date = new Date();
        const m = month ? parseInt(month as string) : date.getMonth() + 1;
        const y = year ? parseInt(year as string) : date.getFullYear();

        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59);

        const attendances = await Attendance.findAll({
            where: {
                userId,
                timestamp: {
                    [Op.gte]: startOfMonth,
                    [Op.lte]: endOfMonth
                }
            },
            order: [['timestamp', 'DESC']]
        });

        res.json(attendances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Monitoring: Get today's attendance for all users
export const getDailyMonitoring = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Month range for points
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Get max points setting
        const Settings = require('../models/Settings').default;
        const maxPointsSetting = await Settings.findByPk('max_punishment_points');
        const maxPoints = maxPointsSetting ? parseInt(maxPointsSetting.value) : 50;

        // Get all users
        const users = await User.findAll({
            attributes: ['id', 'name', 'role'],
            include: [{ model: Branch, attributes: ['name'] }]
        });

        // Get all attendances for today
        const attendances = await Attendance.findAll({
            where: {
                timestamp: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            },
            include: [{ model: User, attributes: ['name'] }]
        });

        // Get punishments for this month
        const punishments = await Punishment.findAll({
            where: {
                date: {
                    [Op.gte]: startOfMonth,
                    [Op.lte]: endOfMonth
                }
            }
        });

        // Merge data
        const monitoring = users.map(user => {
            const userAtt = attendances.filter(a => a.userId === user.id);
            const checkIn = userAtt.find(a => a.type === 'CHECK_IN');
            const checkOut = userAtt.find(a => a.type === 'CHECK_OUT');

            // Calculate total points
            const userPunishments = punishments.filter(p => p.userId === user.id);
            const totalPoints = userPunishments.reduce((sum, p) => sum + p.points, 0);
            const isHighRisk = totalPoints > maxPoints;

            return {
                userId: user.id,
                name: user.name,
                role: user.role,
                branch: (user as any).Branch?.name || '-',
                status: checkIn ? (checkIn.isLate ? 'Telat' : 'Hadir') : 'Belum Hadir',
                checkInTime: checkIn ? checkIn.timestamp : null,
                checkOutTime: checkOut ? checkOut.timestamp : null,
                notes: checkIn?.notes,
                photoUrl: checkIn?.photoUrl,
                totalPoints,
                isHighRisk
            };
        });

        res.json(monitoring);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Give punishment
export const addPunishment = async (req: Request, res: Response) => {
    try {
        const { userId, points, reason } = req.body;

        await Punishment.create({
            userId,
            points,
            reason,
            date: new Date()
        });

        res.json({ message: 'Sanksi berhasil diberikan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- USER MANAGEMENT ---

// --- USER MANAGEMENT ---

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, branchId, position } = req.body;
        const exists = await User.findOne({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email sudah terdaftar' });

        const passwordHash = await bcrypt.hash(password, 10);

        // Security: If creator is HEAD, force branchId to their own branch
        // Note: 'req.user' isn't available here because this is adminController, usually open or strictly middleware checked.
        // We should ensure the route is protected. Assuming 'req.user' exists via AuthRequest casting.
        const authReq = req as any;
        let finalBranchId = branchId;

        if (authReq.user && authReq.user.role === 'HEAD') {
            // HEAD cannot create OWNER users
            if (role === 'OWNER') {
                return res.status(403).json({ message: 'Anda tidak dapat membuat user dengan role OWNER.' });
            }
            finalBranchId = authReq.user.branchId;
            if (!finalBranchId) return res.status(400).json({ message: 'Anda tidak memiliki cabang.' });
        }

        const newUser = await User.create({
            name, email, passwordHash, role, branchId: finalBranchId, position
        });

        res.status(201).json({ message: 'User berhasil dibuat', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, position } = req.body;
        let branchId = req.body.branchId;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        // Security for HEAD
        const authReq = req as any;

        // Fetch authenticated user to get branchId (JWT doesn't include it)
        const authUser = await User.findByPk(authReq.user.id);
        if (!authUser) {
            return res.status(401).json({ message: 'User tidak terautentikasi' });
        }

        console.log('🔍 UPDATE USER DEBUG:');
        console.log('User ID:', id);
        console.log('User branchId:', user.branchId);
        console.log('Auth user ID:', authUser.id);
        console.log('Auth user role:', authUser.role);
        console.log('Auth user branchId:', authUser.branchId);
        console.log('Request branchId:', branchId);

        if (authUser.role === 'HEAD') {
            console.log('✅ User is HEAD');
            // HEAD cannot edit OWNER users
            if (user.role === 'OWNER') {
                console.log('❌ Cannot edit OWNER');
                return res.status(403).json({ message: 'Anda tidak dapat mengedit user dengan role OWNER.' });
            }
            // HEAD can only edit users in their branch
            if (user.branchId !== authUser.branchId) {
                console.log('❌ User not in HEAD branch');
                console.log('   User branchId:', user.branchId, 'vs Auth branchId:', authUser.branchId);
                return res.status(403).json({ message: 'Tidak dapat mengedit user dari cabang lain.' });
            }
            // HEAD cannot change user to different branch
            if (branchId && branchId !== authUser.branchId) {
                console.log('❌ Trying to change branch');
                return res.status(403).json({ message: 'Anda tidak dapat memindahkan user ke cabang lain.' });
            }
            // Force branchId to HEAD's branch
            branchId = authUser.branchId;
            console.log('✅ Forced branchId to:', branchId);
        }

        let updateData: any = { name, email, role, branchId, position };
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        console.log('📝 Update data:', updateData);
        await user.update(updateData);
        console.log('✅ User updated successfully');
        res.json({ message: 'User berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Security for HEAD
        const authReq = req as any;
        if (authReq.user && authReq.user.role === 'HEAD') {
            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

            // HEAD cannot delete OWNER users
            if (user.role === 'OWNER') {
                return res.status(403).json({ message: 'Anda tidak dapat menghapus user dengan role OWNER.' });
            }

            // HEAD can only delete users in their branch
            if (user.branchId !== authReq.user.branchId) {
                return res.status(403).json({ message: 'Tidak dapat menghapus user dari cabang lain.' });
            }
        }

        await User.destroy({ where: { id } });
        res.json({ message: 'User berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
