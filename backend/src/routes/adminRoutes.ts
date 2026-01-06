// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\routes\adminRoutes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { getEmployees, getDailyMonitoring, getEmployeeAttendance, addPunishment, createUser, updateUser, deleteUser } from '../controllers/adminController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { triggerBackup, getBackups, downloadBackup, deleteBackup } from '../controllers/backupController';

const router = Router();

// Middleware: Harus login dan role OWNER atau HEAD
router.use(authenticateToken);
router.use(requireRole(['OWNER', 'HEAD']));

router.get('/employees', getEmployees);
router.get('/monitoring', getDailyMonitoring);
router.get('/attendance/:userId', getEmployeeAttendance);
router.post('/punishment', addPunishment);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// User Management
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Backups (OWNER only)
router.get('/backups', requireRole(['OWNER']), getBackups);
router.post('/backups', requireRole(['OWNER']), triggerBackup);
router.get('/backups/download/:fileName', requireRole(['OWNER']), downloadBackup);
router.delete('/backups/:fileName', requireRole(['OWNER']), deleteBackup);

export default router;
