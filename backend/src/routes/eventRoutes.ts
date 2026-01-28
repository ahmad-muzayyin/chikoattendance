import express from 'express';
import { getEvents, createEvent, deleteEvent, updateEvent } from '../controllers/eventController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Allow HEAD and OWNER to manage events
// Allow EMPLOYEE to read events (handled by getEvents public or authenticated?)
// Requirement says Manager manages it.
// Employees need to see it in AttendanceInputScreen, so GET should be open to authenticated users.

router.get('/', authenticateToken, getEvents); // All auth users
router.post('/', authenticateToken, requireRole([UserRole.OWNER, UserRole.HEAD]), createEvent);
router.put('/:id', authenticateToken, requireRole([UserRole.OWNER, UserRole.HEAD]), updateEvent); // Add PUT
router.delete('/:id', authenticateToken, requireRole([UserRole.OWNER, UserRole.HEAD]), deleteEvent);

export default router;
