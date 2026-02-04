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
const Attendance = sequelize.define('Attendance', {
    userId: DataTypes.INTEGER,
    type: DataTypes.ENUM('CHECK_IN', 'CHECK_OUT', 'PERMIT', 'SICK'),
    timestamp: DataTypes.DATE,
    isLate: DataTypes.BOOLEAN,
    isHalfDay: DataTypes.BOOLEAN,
    notes: DataTypes.TEXT
}, { timestamps: true });

const Shift = sequelize.define('Shift', {
    name: DataTypes.STRING,
    startHour: DataTypes.STRING, // "09:00"
    endHour: DataTypes.STRING
}, { timestamps: true });

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

        const lateAttendances = await Attendance.findAll({
            where: {
                type: 'CHECK_IN',
                // isLate: true, // Kita cek SEMUA checkin, siapa tau ada yang false tapi harusnya true (walaupun jarang)
                timestamp: {
                    [Op.gte]: startOfMonth
                }
            }
        });

        console.log(`Checking ${lateAttendances.length} records...`);

        let correctedCount = 0;

        for (const record of lateAttendances) {
            const checkInTime = new Date(record.timestamp);

            // Konversi ke Menit WIB manually to avoid timezone confusion
            // We assume stored timestamp is correctly UTC or local, handled by Sequelize
            // Let's use getHours which respects the timezone setting if properly loaded, 
            // OR use toLocaleTimeString

            const timeString = checkInTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
            const [hStr, mStr] = timeString.split(':');
            const currentTotalMinutes = parseInt(hStr) * 60 + parseInt(mStr);

            // console.log(`   > Cek ID ${record.id}: ${timeString} (${currentTotalMinutes}m)`);

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

            // HITUNG TELAT ULANG
            const [sHour, sMinute] = targetShift.startHour.split(':').map(Number);
            const shiftStartTotalMinutes = sHour * 60 + sMinute;
            const tolerance = 10; // 10 menit

            const shouldBeLate = currentTotalMinutes > (shiftStartTotalMinutes + tolerance);

            // KOREKSI
            if (record.isLate !== shouldBeLate) {
                console.log(`🛠️ Koreksi ID ${record.id} (${record.type}):`);
                console.log(`   Waktu: ${timeString} (WIB)`);
                console.log(`   Shift: ${targetShift.name} (${targetShift.startHour})`);
                console.log(`   Status Lama: ${record.isLate ? 'TELAT' : 'HADIR'} -> Baru: ${shouldBeLate ? 'TELAT' : 'HADIR'}`);

                record.isLate = shouldBeLate;
                // Opsional: Tambahkan catatan
                if (!shouldBeLate && record.notes && !record.notes.includes('Koreksi')) {
                    record.notes = record.notes + ' (Koreksi Sistem)';
                }

                await record.save();
                correctedCount++;
            }
        }

        console.log(`✅ Selesai! ${correctedCount} data absensi telah dikoreksi.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixLateStatus();
