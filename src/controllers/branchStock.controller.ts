import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import branchStockService from '../services/branchStock.service';

export class BranchStockController {
  async assignStock(req: AuthRequest, res: Response) {
    try {
      const { productId, branchId, quantity } = req.body;
      const result = await branchStockService.assignStock(Number(productId), Number(branchId), Number(quantity));
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getByBranch(req: AuthRequest, res: Response) {
    try {
      const stocks = await branchStockService.getByBranch(Number(req.params.branchId));
      res.json({ success: true, data: stocks });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProductsWithAvailability(req: AuthRequest, res: Response) {
    try {
      const orgId = req.query.organizationId ? Number(req.query.organizationId) : undefined;
      const products = await branchStockService.getProductsWithAvailability(orgId);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new BranchStockController();
