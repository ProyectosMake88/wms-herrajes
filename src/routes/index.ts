import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import inventoryRoutes from './inventory.routes';
import reportRoutes from './report.routes';
import { authMiddleware, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas - requieren autenticación
router.use('/categories', authMiddleware, categoryRoutes);
router.use('/products', authMiddleware, productRoutes);
router.use('/inventory', authMiddleware, inventoryRoutes);
router.use('/reports', authMiddleware, reportRoutes);

export default router;
