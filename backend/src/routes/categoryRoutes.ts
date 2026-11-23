import { Router } from 'express';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { verifyToken } from '../middlewares/authMiddleware';
import { allowRoles } from '../middlewares/roleMiddleware';

const router = Router();

router.get('/', verifyToken, getAllCategories); // Semua yang login bisa lihat
router.post('/', verifyToken, allowRoles('admin'), createCategory); // Hanya admin
router.put('/:id', verifyToken, allowRoles('admin'), updateCategory);
router.delete('/:id', verifyToken, allowRoles('admin'), deleteCategory);

export default router;