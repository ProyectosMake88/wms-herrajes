import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { validateDateRange } from '../middlewares/validation.middleware';

const router = Router();

// Reporte general de existencias
router.get('/stock', reportController.getStockReport);

// Reporte filtrado por categoría
router.get('/stock/category/:categoryId', reportController.getStockByCategory);

// Reporte de movimientos por rango de fechas
router.get('/movements', validateDateRange, reportController.getMovementsReport);

// Reporte de productos con stock bajo
router.get('/low-stock', reportController.getLowStockReport);

export default router;
