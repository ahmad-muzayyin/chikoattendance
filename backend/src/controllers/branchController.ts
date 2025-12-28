// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\controllers\branchController.ts
import { Request, Response } from 'express';
import { Branch } from '../models/Branch';

export const createBranch = async (req: Request, res: Response) => {
    try {
        const { name, address, latitude, longitude, radius, startHour, endHour } = req.body;

        const newBranch = await Branch.create({
            name,
            address,
            latitude,
            longitude,
            radius: radius || 100, // Default 100 meters
            startHour: startHour || "09:00",
            endHour: endHour || "17:00"
        });

        res.status(201).json({ message: 'Outlet berhasil dibuat', data: newBranch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat outlet' });
    }
};

export const getBranches = async (req: Request, res: Response) => {
    try {
        const branches = await Branch.findAll();
        res.json(branches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateBranch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, address, latitude, longitude, radius, startHour, endHour } = req.body;

        const branch = await Branch.findByPk(id);
        if (!branch) return res.status(404).json({ message: 'Outlet tidak ditemukan' });

        await branch.update({ name, address, latitude, longitude, radius, startHour, endHour });

        res.json({ message: 'Outlet berhasil diupdate', data: branch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteBranch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const branch = await Branch.findByPk(id);

        if (!branch) return res.status(404).json({ message: 'Outlet tidak ditemukan' });

        await branch.destroy();

        res.json({ message: 'Outlet berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
