import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import inventoryRoutes from './inventory.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import companyRoutes from './company.routes';
import pendingEntryRoutes from './pendingEntry.routes';
import branchRoutes from './branch.routes';
import organizationRoutes from './organization.routes';
import branchStockRoutes from './branchStock.routes';
import { authMiddleware, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas - requieren autenticación
router.use('/categories', authMiddleware, categoryRoutes);
router.use('/products', authMiddleware, productRoutes);
router.use('/inventory', authMiddleware, inventoryRoutes);
router.use('/reports', authMiddleware, reportRoutes);
router.use('/notifications', authMiddleware, notificationRoutes);
router.use('/company', authMiddleware, companyRoutes);
router.use('/pending-entries', authMiddleware, pendingEntryRoutes);
router.use('/branches', authMiddleware, branchRoutes);
router.use('/organizations', authMiddleware, organizationRoutes);
router.use('/branch-stock', authMiddleware, branchStockRoutes);

export default router;
