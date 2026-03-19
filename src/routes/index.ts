import { Router } from 'express';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import inventoryRoutes from './inventory.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportRoutes);

export default router;
