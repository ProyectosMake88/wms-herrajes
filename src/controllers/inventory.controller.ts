import { Request, Response } from 'express';
import inventoryService from '../services/inventory.service';

export class InventoryController {
  /**
   * POST /api/inventory/movement
   * Registra una Entrada o Salida de inventario
   */
  async registerMovement(req: Request, res: Response) {
    try {
      const { productId, type, quantity, reason, responsible, notes } = req.body;
      const result = await inventoryService.registerMovement({
        productId,
        type,
        quantity,
        reason,
        responsible,
        notes,
      });

      const statusMsg = result.product.isLowStock
        ? `ALERTA: Stock bajo para "${result.product.name}". Stock actual: ${result.product.currentStock}, Mínimo: ${result.product.minimumStock}`
        : null;

      res.status(201).json({
        success: true,
        data: result,
        alert: statusMsg,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/inventory/movements
   * Lista movimientos con filtros opcionales
   */
  async getMovements(req: Request, res: Response) {
    try {
      const filters = {
        type: req.query.type as any,
        productId: req.query.productId ? Number(req.query.productId) : undefined,
      };
      const movements = await inventoryService.getMovements(filters);
      res.json({ success: true, data: movements });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/inventory/movements/product/:productId
   * Historial de movimientos de un producto específico
   */
  async getMovementsByProduct(req: Request, res: Response) {
    try {
      const movements = await inventoryService.getMovementsByProduct(Number(req.params.productId));
      res.json({ success: true, data: movements });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new InventoryController();
