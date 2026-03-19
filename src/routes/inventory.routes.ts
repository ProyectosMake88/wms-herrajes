import { Router } from 'express';
import inventoryController from '../controllers/inventory.controller';
import { validateMovement } from '../middlewares/validation.middleware';
import { stockAlertMiddleware } from '../middlewares/stockAlert.middleware';

const router = Router();

// Registrar movimiento (Entrada/Salida) con middleware de alerta de stock
router.post('/movement', validateMovement, stockAlertMiddleware, inventoryController.registerMovement);

// Listar movimientos
router.get('/movements', inventoryController.getMovements);

// Historial de movimientos por producto
router.get('/movements/product/:productId', inventoryController.getMovementsByProduct);

export default router;
