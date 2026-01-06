import { Request, Response } from 'express';
import { runBackup, listBackups } from '../utils/backup';
import path from 'path';
import fs from 'fs';

export const triggerBackup = async (req: Request, res: Response) => {
    try {
        const fileName = await runBackup();
        res.status(200).json({ message: 'Backup berhasil dibuat', fileName });
    } catch (error: any) {
        res.status(500).json({ message: 'Gagal membuat backup', error: error.message });
    }
};

export const getBackups = (req: Request, res: Response) => {
    try {
        const backups = listBackups();
        res.status(200).json(backups);
    } catch (error: any) {
        res.status(500).json({ message: 'Gagal mengambil daftar backup', error: error.message });
    }
};

export const downloadBackup = (req: Request, res: Response) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(__dirname, '../../backups', fileName);

        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).json({ message: 'File tidak ditemukan' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Gagal mendownload backup', error: error.message });
    }
};

export const deleteBackup = (req: Request, res: Response) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(__dirname, '../../backups', fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({ message: 'Backup berhasil dihapus' });
        } else {
            res.status(404).json({ message: 'File tidak ditemukan' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Gagal menghapus backup', error: error.message });
    }
};
