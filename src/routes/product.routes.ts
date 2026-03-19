import { Router } from 'express';
import productController from '../controllers/product.controller';
import { validateId } from '../middlewares/validation.middleware';
import { uploadProductImage } from '../config/upload';

const router = Router();

router.get('/', productController.getAll);
router.get('/low-stock', productController.getLowStock);
router.get('/sku/:sku', productController.getBySku);
router.get('/:id', validateId, productController.getById);
// POST y PUT usan multer para recibir imagen via FormData
router.post('/', uploadProductImage.single('image'), productController.create);
router.put('/:id', validateId, uploadProductImage.single('image'), productController.update);
router.delete('/:id', validateId, productController.delete);

export default router;
