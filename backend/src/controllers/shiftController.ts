import { Request, Response } from 'express';
import { Shift } from '../models/Shift';

export const getShifts = async (req: Request, res: Response) => {
    try {
        const shifts = await Shift.findAll();
        res.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ message: 'Server error fetching shifts' });
    }
};

export const createShift = async (req: Request, res: Response) => {
    try {
        const { name, startHour, endHour } = req.body;
        const shift = await Shift.create({ name, startHour, endHour });
        res.status(201).json(shift);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating shift' });
    }
};

export const updateShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, startHour, endHour } = req.body;

        const shift = await Shift.findByPk(id);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        await shift.update({ name, startHour, endHour });
        res.json(shift);
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ message: 'Server error updating shift' });
    }
};

export const deleteShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const shift = await Shift.findByPk(id);

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        await shift.destroy();
        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ message: 'Server error deleting shift' });
    }
};
