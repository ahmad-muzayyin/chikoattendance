
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { Attendance, AttendanceType } from '../models/Attendance';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';

export const exportBranchExcel = async (req: AuthRequest, res: Response) => {
    try {
        const { branchId } = req.params;
        const { month, year } = req.query;

        if (!branchId || !month || !year) {
            return res.status(400).json({ message: 'Missing parameters: branchId, month, year' });
        }

        const m = parseInt(month as string);
        const y = parseInt(year as string);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const branch = await Branch.findByPk(branchId);
        if (!branch) return res.status(404).json({ message: 'Branch not found' });

        const employees = await User.findAll({
            where: { branchId },
            include: [{
                model: Attendance,
                required: false,
                where: {
                    timestamp: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            }],
            order: [['name', 'ASC'], [Attendance, 'timestamp', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rekap Absensi');

        // Styles
        worksheet.columns = [
            { header: 'ID Karyawan', key: 'id', width: 10 },
            { header: 'Nama', key: 'name', width: 25 },
            { header: 'Jabatan', key: 'role', width: 15 },
            { header: 'Hadir', key: 'hadir', width: 10 },
            { header: 'Telat', key: 'telat', width: 10 },
            { header: 'Izin/Sakit', key: 'izin', width: 10 },
            { header: 'Alpha', key: 'alpha', width: 10 },
            { header: 'Total Check-In', key: 'total_checkin', width: 15 },
        ];

        // Title Row
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').value = `REKAP ABSENSI - ${branch.name.toUpperCase()}`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:H2');
        worksheet.getCell('A2').value = `Periode: ${startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        worksheet.getRow(4).values = ['ID', 'Nama', 'Jabatan', 'Hadir', 'Telat', 'Izin/Sakit', 'Alpha', 'Detil Kehadiran'];
        worksheet.getRow(4).font = { bold: true };

        let rowIndex = 5;

        employees.forEach(emp => {
            const attendances = emp.Attendances || [];

            // Calculate Stats
            // Note: This logic duplicates what's in frontend/adminController. 
            // Ideally should be a shared utility, but we'll inline for now.

            // Group by day to handle multiple scans/pairs
            const dailyStats: Record<string, any> = {};

            attendances.forEach((att: any) => {
                const day = new Date(att.timestamp).getDate();
                if (!dailyStats[day]) dailyStats[day] = {};

                if (att.type === 'CHECK_IN') dailyStats[day].checkIn = att;
                if (att.type === 'CHECK_OUT') dailyStats[day].checkOut = att;
                if (att.type === 'PERMIT' || att.type === 'SICK') dailyStats[day].permit = att;
                if (att.type === 'ALPHA') dailyStats[day].alpha = att;
            });

            let hadir = 0;
            let telat = 0;
            let izin = 0;
            let alpha = 0;

            Object.values(dailyStats).forEach((day: any) => {
                if (day.alpha) alpha++;
                else if (day.permit) izin++;
                else if (day.checkIn) {
                    hadir++;
                    if (day.checkIn.isLate) telat++;
                }
            });

            worksheet.addRow({
                id: emp.id,
                name: emp.name,
                role: emp.role,
                hadir,
                telat,
                izin,
                alpha,
                total_checkin: attendances.length
            });
            rowIndex++;
        });

        // Set Headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Rekap_${branch.name.replace(/\s+/g, '_')}_${month}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};

export const exportBranchPDF = async (req: AuthRequest, res: Response) => {
    try {
        const { branchId } = req.params;
        const { month, year } = req.query;

        if (!branchId || !month || !year) {
            return res.status(400).json({ message: 'Missing parameters' });
        }

        const m = parseInt(month as string);
        const y = parseInt(year as string);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const branch = await Branch.findByPk(branchId);
        if (!branch) return res.status(404).json({ message: 'Branch not found' });

        const employees = await User.findAll({
            where: { branchId },
            include: [{
                model: Attendance,
                required: false,
                where: {
                    timestamp: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            }],
            order: [['name', 'ASC']]
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Rekap_${branch.name}_${month}_${year}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(18).text(`REKAP ABSENSI - ${branch.name.toUpperCase()}`, { align: 'center' });
        doc.fontSize(12).text(`Periode: ${startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`, { align: 'center' });
        doc.moveDown();

        // Table Data
        const tableData = employees.map(emp => {
            const attendances = emp.Attendances || [];

            // Stats logic
            const dailyStats: Record<string, any> = {};
            attendances.forEach((att: any) => {
                const day = new Date(att.timestamp).getDate();
                if (!dailyStats[day]) dailyStats[day] = {};
                if (att.type === 'CHECK_IN') dailyStats[day].checkIn = att;
                if (att.type === 'PERMIT' || att.type === 'SICK') dailyStats[day].permit = att;
                if (att.type === 'ALPHA') dailyStats[day].alpha = att;
            });

            let hadir = 0, telat = 0, izin = 0, alpha = 0;
            Object.values(dailyStats).forEach((day: any) => {
                if (day.alpha) alpha++;
                else if (day.permit) izin++;
                else if (day.checkIn) {
                    hadir++;
                    if (day.checkIn.isLate) telat++;
                }
            });

            return [
                emp.name,
                emp.role,
                hadir.toString(),
                telat.toString(),
                izin.toString(),
                alpha.toString()
            ];
        });

        const table = {
            title: "Ringkasan Kehadiran Karyawan",
            headers: ["Nama", "Jabatan", "Hadir", "Telat", "Izin", "Alpha"],
            rows: tableData,
        };

        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: () => doc.font("Helvetica").fontSize(10)
        });

        doc.end();

    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};
