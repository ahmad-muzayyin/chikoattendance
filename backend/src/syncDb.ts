import { sequelize } from './config/db';
import { User } from './models/User';
import { Attendance } from './models/Attendance';
import { Branch } from './models/Branch';
import { Punishment } from './models/Punishment';
import { AuditLog } from './models/AuditLog';
import { Notification } from './models/Notification';
import { Shift } from './models/Shift';

const sync = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync models independently
        try { await Branch.sync({ alter: true }); console.log('Branch synced'); } catch (e) { console.error('Branch sync failed', e); }
        try { await Shift.sync({ alter: true }); console.log('Shift synced'); } catch (e) { console.error('Shift sync failed', e); }
        try { await User.sync({ alter: true }); console.log('User synced'); } catch (e) { console.error('User sync failed', e); }
        try { await Notification.sync({ alter: true }); console.log('Notification synced'); } catch (e) { console.error('Notification sync failed', e); }
        try { await Attendance.sync({ alter: true }); console.log('Attendance synced'); } catch (e) { console.error('Attendance sync failed', e); }
        try { await Punishment.sync({ alter: true }); console.log('Punishment synced'); } catch (e) { console.error('Punishment sync failed', e); }
        try { await AuditLog.sync({ alter: true }); console.log('AuditLog synced'); } catch (e) { console.error('AuditLog sync failed', e); }

        console.log('Sync process completed.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

sync();
