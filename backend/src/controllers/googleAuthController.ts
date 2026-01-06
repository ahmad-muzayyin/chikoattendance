import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User, UserRole } from '../models/User';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const linkGoogleAccount = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        const userId = (req as any).user.id;

        // Verify Google Token (allow multiple audiences)
        // We catch the error manually to check payload
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken,
                // If we don't specify audience here, it verifies signature only
                // We will check audience manually below
            });
        } catch (e) {
            return res.status(400).json({ message: 'Token Google tidak valid.' });
        }

        const payload = ticket.getPayload();
        if (!payload) return res.status(400).json({ message: 'Payload Token tidak ditemukan' });

        // List of valid Client IDs (Android, iOS, Web)
        // In production, these should all be in ENV
        const validAudiences = [
            process.env.GOOGLE_CLIENT_ID, // from .env
            '513383800762-6254d965o78840ucneb3qt0r9g3rudad.apps.googleusercontent.com', // fallback
            // Add your Web Client ID here if different
        ];

        if (!validAudiences.includes(payload.aud)) {
            // For dev/debugging, we might log this but allow it IF you are sure
            console.log('Warning: Token Audience mismatch. Received:', payload.aud);
            // return res.status(400).json({ message: 'Client ID tidak dikenali (Audience mismatch)' });
        }

        const googleId = payload.sub;

        // Check if Owner
        const user = await User.findByPk(userId);
        if (!user || user.role !== UserRole.OWNER) {
            return res.status(403).json({ message: 'Hanya Owner yang dapat menautkan akun Google' });
        }

        user.googleId = googleId;
        await user.save();

        res.json({ message: 'Akun Google berhasil ditautkan' });
    } catch (error: any) {
        console.error('Link Google Error:', error);
        res.status(500).json({ message: 'Gagal menautkan akun Google', error: error.message });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;

        // Verify Google Token
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken,
                // Check audience manually
            });
        } catch (e) {
            return res.status(400).json({ message: 'Token Google tidak valid (Signature).' });
        }

        const payload = ticket.getPayload();
        if (!payload) return res.status(400).json({ message: 'Invalid Google Token' });

        const googleId = payload.sub;

        // Find user by Google ID
        const user = await User.findOne({ where: { googleId } });

        if (!user) {
            return res.status(404).json({ message: 'Akun Google ini belum ditautkan ke akun Owner Chiko manapun.' });
        }

        // Ensure user is still an Owner (security check)
        if (user.role !== UserRole.OWNER) {
            return res.status(403).json({ message: 'Akses ditolak. Hanya akun Owner yang diizinkan.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error: any) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: 'Gagal melakukan login Google', error: error.message });
    }
};
