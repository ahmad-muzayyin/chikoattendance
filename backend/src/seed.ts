import { connectDB } from './config/db';
import { User, UserRole } from './models/User';
import { Branch } from './models/Branch';
import { Shift } from './models/Shift';
import bcrypt from 'bcrypt';

const seed = async () => {
    try {
        await connectDB();

        // 1. Create Main Branch
        // -------------------------------------------------------------------------
        const branch = await Branch.create({
            name: 'Pusat Chiko',
            address: 'Jl. Merdeka No 1',
            latitude: -6.200000,
            longitude: 106.816666,
            radius: 100,
            startHour: '08:00',
            endHour: '17:00'
        });

        console.log('Branch created:', branch.name);

        // 2. Create Shifts
        // -------------------------------------------------------------------------
        const shiftPagi = await Shift.create({
            name: 'Shift Pagi',
            startHour: '08:00',
            endHour: '16:00'
        });
        const shiftMalam = await Shift.create({
            name: 'Shift Siang',
            startHour: '13:00',
            endHour: '21:00'
        });
        console.log('Shifts created');

        const passwordHash = await bcrypt.hash('123456', 10);

        // 3. Create Users
        // -------------------------------------------------------------------------

        // OWNER
        await User.create({
            name: 'Big Boss Owner',
            email: 'owner@chiko.com',
            passwordHash,
            role: UserRole.OWNER,
            branchId: branch.id
        });
        console.log('User created: owner@chiko.com (Pass: 123456)');

        // HEAD STORE (Kepala Toko)
        await User.create({
            name: 'Manager Budi',
            email: 'head@chiko.com',
            passwordHash,
            role: UserRole.HEAD,
            branchId: branch.id
        });
        console.log('User created: head@chiko.com (Pass: 123456)');

        // SUPERVISOR (Pengawas)
        await User.create({
            name: 'Supervisor Andi',
            email: 'supervisor@chiko.com',
            passwordHash,
            role: UserRole.SUPERVISOR,
            // Supervisors might not be bound to a specific branch in the DB, 
            // but we can assign a "home base" or leave null if allowed.
            // For now, let's leave branchId null or assign to main branch.
            branchId: branch.id
        });
        console.log('User created: supervisor@chiko.com (Pass: 123456)');

        // EMPLOYEE (Karyawan - Pagi)
        await User.create({
            name: 'Karyawan Siti',
            email: 'employee@chiko.com',
            passwordHash,
            role: UserRole.EMPLOYEE,
            branchId: branch.id,
            shiftId: shiftPagi.id
        });
        console.log('User created: employee@chiko.com (Shift Pagi)');

        // EMPLOYEE (Karyawan - Siang)
        await User.create({
            name: 'Karyawan Joko',
            email: 'employee2@chiko.com',
            passwordHash,
            role: UserRole.EMPLOYEE,
            branchId: branch.id,
            shiftId: shiftMalam.id
        });
        console.log('User created: employee2@chiko.com (Shift Siang)');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seed();
