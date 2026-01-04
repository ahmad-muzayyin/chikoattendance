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
