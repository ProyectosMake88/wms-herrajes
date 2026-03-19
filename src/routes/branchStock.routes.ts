import { Router } from 'express';
import branchStockController from '../controllers/branchStock.controller';
import { adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.get('/available', branchStockController.getProductsWithAvailability);
router.get('/branch/:branchId', branchStockController.getByBranch);
router.post('/assign', adminOnly, branchStockController.assignStock);

export default router;
