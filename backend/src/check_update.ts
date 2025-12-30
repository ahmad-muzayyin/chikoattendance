import { sequelize } from './config/db';
import { Shift } from './models/Shift';
import { User, UserRole } from './models/User';
import { Branch } from './models/Branch';

const check = async () => {
    try {
        await sequelize.authenticate();
        // await sequelize.sync({ alter: true }); // Ensure sync happens

        // Sync specific order
        await Branch.sync({ alter: true });
        await Shift.sync({ alter: true });

        try {
            await User.sync({ alter: true });
        } catch (err: any) {
            console.error('User sync failed via Sequelize, trying manual raw SQL fix...', err.message);

            // Raw SQL fallback for User table update
            try {
                // Check if shiftId column exists
                const [columns] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'shiftId'");
                if (columns.length === 0) {
                    await sequelize.query("ALTER TABLE users ADD COLUMN shiftId INTEGER UNSIGNED NULL, ADD CONSTRAINT fk_users_shiftId FOREIGN KEY (shiftId) REFERENCES shifts(id) ON DELETE SET NULL ON UPDATE CASCADE;");
                    console.log('Added shiftId column manually.');
                }

                // Update ENUM role to include SUPERVISOR
                // Note: Modifying ENUM in MySQL 
                await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'OWNER', 'HEAD', 'EMPLOYEE', 'SUPERVISOR') NOT NULL DEFAULT 'EMPLOYEE';");
                console.log('Updated role ENUM manually.');

            } catch (manualErr: any) {
                console.error('Manual generic fix failed:', manualErr.message);
            }
        }

        console.log('Sync complete.');

        // Check if Shifts exist
        const shifts = await Shift.findAll();
        console.log(`Shifts found: ${shifts.length}`);
        if (shifts.length === 0) {
            console.log('Creating shifts...');
            await Shift.create({ name: 'Shift Pagi', startHour: '08:00', endHour: '16:00' });
            await Shift.create({ name: 'Shift Siang', startHour: '13:00', endHour: '21:00' });
            console.log('Shifts created.');
        } else {
            shifts.forEach(s => console.log(`- ${s.name} (${s.startHour} - ${s.endHour})`));
        }

        // Check for Supervisor
        const supervisor = await User.findOne({ where: { role: UserRole.SUPERVISOR } });
        if (!supervisor) {
            console.log('Creating Supervisor...');
            const branch = await sequelize.models.Branch.findOne(); // Get any branch
            const bcrypt = require('bcrypt');
            const passwordHash = await bcrypt.hash('123456', 10);

            await User.create({
                name: 'Supervisor Andi',
                email: 'supervisor@chiko.com',
                passwordHash,
                role: UserRole.SUPERVISOR,
                branchId: branch ? (branch as any).id : null
            });
            console.log('Supervisor created.');
        } else {
            console.log('Supervisor exists:', supervisor.name);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
