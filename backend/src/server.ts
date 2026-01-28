// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import branchRoutes from './routes/branchRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import shiftRoutes from './routes/shiftRoutes';
import positionRoutes from './routes/positionRoutes';
import eventRoutes from './routes/eventRoutes'; // Import Event Routes
import { connectDB } from './config/db';
import { User, UserRole } from './models/User';
import { Event } from './models/Event'; // Import Event Model
import { initAutoBackup } from './utils/backup';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/events', eventRoutes); // Register Event Routes

// Test endpoint
app.get('/api/ping', (req, res) => {
    res.json({ message: 'Pong! Backend is reachable.', time: new Date() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
const startServer = async () => {
    await connectDB();

    // Seed default positions
    try {
        const { Position } = require('./models/Position');
        const count = await Position.count();
        if (count === 0) {
            const defaults = ['Koki', 'Pelayan', 'Kasir', 'Barista', 'Helper', 'Admin', 'Supervisor'];
            for (const name of defaults) {
                await Position.create({ name });
            }
            console.log('✅ Seeded default positions');
        }
    } catch (e) {
        console.error('Seeding positions error', e);
    }

    // Auto-promote admin to OWNER
    try {
        const admin = await User.findOne({ where: { email: 'admin@chiko.com' } });
        if (admin && admin.role !== UserRole.OWNER) {
            admin.role = UserRole.OWNER;
            await admin.save();
            console.log('Role updated: admin@chiko.com is now OWNER');
        }
    } catch (e) { console.error('Auto-promote error', e); }

    // Listen
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Accessible from LAN at http://<YOUR_IP>:${PORT}`);

        // Initialize Auto Backup
        initAutoBackup();

        // Initialize Scheduler (Alpha Check)
        const { initScheduler } = require('./utils/scheduler');
        initScheduler();
    });
};

startServer();
