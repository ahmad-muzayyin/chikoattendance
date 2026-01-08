import { Request, Response } from 'express';
import { Position } from '../models/Position';
import { User } from '../models/User';

// Get all positions
export const getPositions = async (req: Request, res: Response) => {
    try {
        const positions = await Position.findAll({
            order: [['name', 'ASC']]
        });
        res.json(positions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new position
export const createPosition = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Nama posisi harus diisi' });

        const exists = await Position.findOne({ where: { name } });
        if (exists) return res.status(400).json({ message: 'Posisi sudah ada' });

        const position = await Position.create({ name });
        res.status(201).json(position);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat posisi' });
    }
};

// Update position
export const updatePosition = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const position = await Position.findByPk(id);
        if (!position) return res.status(404).json({ message: 'Posisi tidak ditemukan' });

        const oldName = position.name;

        // Update position name in Position table
        await position.update({ name });

        // Update all users who had the old position name
        if (oldName !== name) {
            await User.update({ position: name }, { where: { position: oldName } });
        }

        res.json({ message: 'Posisi berhasil diupdate', position });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengupdate posisi' });
    }
};

// Delete position
export const deletePosition = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const position = await Position.findByPk(id);
        if (!position) return res.status(404).json({ message: 'Posisi tidak ditemukan' });

        await position.destroy();
        // Optional: We could set user positions to null, but keeping them as legacy string is safer for now.

        res.json({ message: 'Posisi berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus posisi' });
    }
};
