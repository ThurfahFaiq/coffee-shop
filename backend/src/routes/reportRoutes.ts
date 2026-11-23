import { Router } from 'express';
import { getDailyReport } from '../controllers/reportController';
import { verifyToken } from '../middlewares/authMiddleware';
import { allowRoles } from '../middlewares/roleMiddleware';

const router = Router();

// Hanya Admin yang boleh melihat laporan keuangan
router.get('/daily', verifyToken, allowRoles('admin'), getDailyReport);

export default router;