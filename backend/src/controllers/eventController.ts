import { Request, Response } from 'express';
import { Event } from '../models/Event';
import { Op } from 'sequelize';

export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await Event.findAll({
            order: [['date', 'ASC']]
        });
        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: 'Error retrieving events' });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { name, date, description, isSpecialEvent } = req.body;

        if (!name || !date) {
            return res.status(400).json({ message: 'Name and date are required' });
        }

        const existing = await Event.findOne({ where: { date } });
        if (existing) {
            return res.status(400).json({ message: 'Event already exists for this date' });
        }

        const event = await Event.create({
            name,
            date,
            description,
            isSpecialEvent: isSpecialEvent !== undefined ? isSpecialEvent : true
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, date, description, isSpecialEvent } = req.body;

        const event = await Event.findByPk(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if date being changed to another existing event that is NOT this event
        if (date && date !== event.date) {
            const existing = await Event.findOne({ where: { date } });
            if (existing) {
                return res.status(400).json({ message: 'Another event already exists for this date' });
            }
        }

        await event.update({
            name,
            date,
            description,
            isSpecialEvent
        });

        res.json(event);
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await Event.destroy({ where: { id } });

        if (!deleted) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ message: 'Error deleting event' });
    }
};
