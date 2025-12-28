// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\controllers\authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { AuthRequest } from '../middleware/authMiddleware';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email }, include: [Branch] });

        if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ message: 'Password salah' });

        // Include role in token for faster middleware checks
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                branchId: user.branchId,
                profile_picture: user.profile_picture,
                branch: (user as any).Branch
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findByPk(req.user?.id, {
            include: [{ model: Branch, attributes: ['name', 'id'] }]
        });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, password, profile_picture } = req.body;
        const user = await User.findByPk(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (profile_picture) user.profile_picture = profile_picture;
        if (password) {
            user.passwordHash = await bcrypt.hash(password, 10);
        }

        await user.save();
        res.json({ message: 'Profil berhasil diperbarui', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updatePushToken = async (req: AuthRequest, res: Response) => {
    try {
        const { pushToken } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        await User.update({ pushToken }, { where: { id: userId } });
        res.json({ message: 'Push token updated' });
    } catch (error) {
        console.error('Update Push Token Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
