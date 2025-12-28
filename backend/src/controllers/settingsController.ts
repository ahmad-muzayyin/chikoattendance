import { Request, Response } from 'express';
import Settings from '../models/Settings';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await Settings.findAll();
        const settingsMap: any = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // Default values
        if (!settingsMap.max_punishment_points) settingsMap.max_punishment_points = '50';

        res.json(settingsMap);
    } catch (error) {
        console.error('Get Settings Error:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ message: 'Key and Value are required' });
        }

        const [setting, created] = await Settings.upsert({ key, value });
        res.json({ message: 'Setting updated', setting });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
};
