import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus, cancelOrder } from '../controllers/orderController';
import { verifyToken } from '../middlewares/authMiddleware';
import { allowRoles } from '../middlewares/roleMiddleware';

const router = Router();

// Customer membuat pesanan
router.post('/', verifyToken, allowRoles('customer'), createOrder);

// Customer melihat pesanannya sendiri, Admin melihat semua pesanan
router.get('/', verifyToken, getOrders);

// Admin mengubah status
router.patch('/:id/status', verifyToken, allowRoles('admin'), updateOrderStatus);

// Customer membatalkan pesanannya, atau Admin membatalkan
router.patch('/:id/cancel', verifyToken, cancelOrder);

export default router;