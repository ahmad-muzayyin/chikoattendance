// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\seed.ts
import { connectDB } from './config/db';
import { User, UserRole } from './models/User';
import { Branch } from './models/Branch';
import bcrypt from 'bcrypt';

const seed = async () => {
    try {
        await connectDB();

        // 1. Create Main Branch
        // -------------------------------------------------------------------------
        // WARNING: Coordinates here are examples. 
        // Owner should update this via app if testing real check-in.
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

        const passwordHash = await bcrypt.hash('123456', 10);

        // 2. Create Users
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

        // EMPLOYEE (Karyawan)
        await User.create({
            name: 'Karyawan Siti',
            email: 'employee@chiko.com',
            passwordHash,
            role: UserRole.EMPLOYEE,
            branchId: branch.id
        });
        console.log('User created: employee@chiko.com (Pass: 123456)');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seed();
