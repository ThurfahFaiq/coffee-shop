import { Router } from 'express';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { verifyToken } from '../middlewares/authMiddleware';
import { allowRoles } from '../middlewares/roleMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.get('/', verifyToken, getAllProducts);
// Gunakan upload.single('image') untuk menerima 1 file dengan key 'image'
router.post('/', verifyToken, allowRoles('admin'), upload.single('image'), createProduct);
router.put('/:id', verifyToken, allowRoles('admin'), upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, allowRoles('admin'), deleteProduct);

export default router;