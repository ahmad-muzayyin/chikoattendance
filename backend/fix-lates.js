const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

// Try to load env from current dir
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Using Config:', {
    user: process.env.DB_USER || 'root',
    db: process.env.DB_NAME || 'chiko_attendance',
    host: process.env.DB_HOST || 'localhost'
});

// Setup Database Connection manually since we are in a standalone script
const sequelize = new Sequelize(
    process.env.DB_NAME || 'chiko_attendance',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
        timezone: '+07:00' // Force WIB
    }
);

// Define simplified models needed
// IMPORTANT: tableName is explicitly set to lowercase 'shifts' and 'attendances' for Linux compatibility
const Attendance = sequelize.define('Attendance', {
    userId: DataTypes.INTEGER,
    type: DataTypes.ENUM('CHECK_IN', 'CHECK_OUT', 'PERMIT', 'SICK', 'ALPHA'),
    timestamp: DataTypes.DATE,
    isLate: DataTypes.BOOLEAN,
    isHalfDay: DataTypes.BOOLEAN,
    notes: DataTypes.TEXT
}, { timestamps: true, tableName: 'attendances' });

const Shift = sequelize.define('Shift', {
    name: DataTypes.STRING,
    startHour: DataTypes.STRING, // "09:00"
    endHour: DataTypes.STRING
}, { timestamps: true, tableName: 'shifts' });

async function fixLateStatus() {
    try {
        console.log('🔄 Memulai proses koreksi keterlambatan...');
        await sequelize.authenticate();
        console.log('✅ Koneksi Database Berhasil.');

        // 1. Ambil Semua Shift
        const shifts = await Shift.findAll();
        console.log(`📋 Ditemukan ${shifts.length} Shift aktif.`);
        shifts.forEach(s => console.log(`   - ${s.name}: ${s.startHour} s/d ${s.endHour}`));

        // 2. Ambil Absensi Bulan Ini yang berstatus TELAT (isLate = true)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const attendances = await Attendance.findAll({
            where: {
                timestamp: {
                    [Op.gte]: startOfMonth
                }
            }
        });

        console.log(`Checking ${attendances.length} records...`);

        // --- GROUP BY USER & DATE UNTUK HAPUS ALPHA PALSU ---
        // Jika User punya CHECK_IN di tanggal X, maka ALPHA di tanggal X harus dihapus.
        const recordMap = {};

        for (const att of attendances) {
            const dateKey = new Date(att.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
            const userKey = `${att.userId}_${dateKey}`;

            if (!recordMap[userKey]) recordMap[userKey] = [];
            recordMap[userKey].push(att);
        }

        let alphaRemoved = 0;
        for (const key in recordMap) {
            const records = recordMap[key];
            const hasCheckIn = records.some(r => r.type === 'CHECK_IN');
            const hasAlpha = records.some(r => r.type === 'ALPHA');

            if (hasCheckIn && hasAlpha) {
                // Hapus semua ALPHA hari ini karena dia hadir
                const alphas = records.filter(r => r.type === 'ALPHA');
                for (const alpha of alphas) {
                    console.log(`🔥 Menghapus ALPHA User ${alpha.userId} tanggal ${alpha.timestamp} karena sudah CHECK_IN.`);
                    await alpha.destroy();
                    alphaRemoved++;
                }
            }
        }
        console.log(`✅ ${alphaRemoved} Data ALPHA palsu dihapus/dibersihkan.`);


        // --- KOREKSI STATUS TELAT ---
        const checkIns = attendances.filter(a => a.type === 'CHECK_IN');
        let correctedCount = 0;

        for (const record of checkIns) {
            const checkInTime = new Date(record.timestamp);

            const timeString = checkInTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
            const [hStr, mStr] = timeString.split(':');
            const currentTotalMinutes = parseInt(hStr) * 60 + parseInt(mStr);

            // SMART SHIFT DETECTION
            let targetShift = null;
            let minDiff = Infinity;

            for (const s of shifts) {
                const [sHour, sMinute] = s.startHour.split(':').map(Number);
                const shiftStartMinutes = sHour * 60 + sMinute;
                let diff = Math.abs(currentTotalMinutes - shiftStartMinutes);
                if (diff < minDiff) {
                    minDiff = diff;
                    targetShift = s;
                }
            }

            if (!targetShift) continue;

            const [sHour, sMinute] = targetShift.startHour.split(':').map(Number);
            const shiftStartTotalMinutes = sHour * 60 + sMinute;
            const tolerance = 10; // 10 menit

            const shouldBeLate = currentTotalMinutes > (shiftStartTotalMinutes + tolerance);

            // KOREKSI
            if (record.isLate !== shouldBeLate) {
                console.log(`🛠️ Koreksi ID ${record.id}: ${timeString} (${targetShift.name}). Status: ${record.isLate ? 'TELAT' : 'HADIR'} -> ${shouldBeLate ? 'TELAT' : 'HADIR'}`);

                record.isLate = shouldBeLate;
                if (!shouldBeLate && record.notes && !record.notes.includes('Koreksi')) {
                    record.notes = record.notes + ' (Koreksi Sistem)';
                }

                await record.save();
                correctedCount++;
            }
        }

        console.log(`✅ Selesai! ${correctedCount} data absensi telah dikoreksi status telatnya.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixLateStatus();
