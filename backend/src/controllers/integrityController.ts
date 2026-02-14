import { Request, Response } from 'express';
import { verifyPlayIntegrity } from '../services/playIntegrityService';

export const verifyIntegrityToken = async (req: Request, res: Response) => {
    try {
        const { integrityToken, nonce } = req.body;

        if (!integrityToken || !nonce) {
            return res.status(400).json({ error: 'Missing integrityToken or nonce' });
        }

        const result = await verifyPlayIntegrity(integrityToken, nonce);

        // Best Practice: Log the result for auditing
        console.log(`[Integrity] Verdict: ${result.status}, Reasons: ${JSON.stringify(result.reasons)}`);

        // If BLOCK, maybe we should return 403? 
        // User asked to return JSON { status, reasons }.
        // We will return 200 OK with the decision payload usually, 
        // so client can handle "BLOCK" by showing a specific UI.

        res.status(200).json({
            status: result.status,
            reasons: result.reasons
        });

    } catch (error: any) {
        console.error('Integrity Controller Error:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};
