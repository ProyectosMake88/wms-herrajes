import { Router } from 'express';
import inventoryController from '../controllers/inventory.controller';
import { validateMovement } from '../middlewares/validation.middleware';
import { stockAlertMiddleware } from '../middlewares/stockAlert.middleware';
import { sellerExitOnly } from '../middlewares/auth.middleware';

const router = Router();

// Registrar movimiento — vendedores solo pueden registrar EXIT (ventas)
router.post('/movement', validateMovement, sellerExitOnly, stockAlertMiddleware, inventoryController.registerMovement);

// Listar movimientos
router.get('/movements', inventoryController.getMovements);

// Historial de movimientos por producto
router.get('/movements/product/:productId', inventoryController.getMovementsByProduct);

export default router;
