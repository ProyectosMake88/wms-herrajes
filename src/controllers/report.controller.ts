import { Request, Response } from 'express';
import reportService from '../services/report.service';

export class ReportController {
  /**
   * GET /api/reports/stock
   * Reporte general de existencias
   */
  async getStockReport(req: Request, res: Response) {
    try {
      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const report = await reportService.getStockReport(branchId);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/reports/stock/category/:categoryId
   * Reporte filtrado por categoría
   */
  async getStockByCategory(req: Request, res: Response) {
    try {
      const report = await reportService.getStockByCategory(Number(req.params.categoryId));
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/reports/movements?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=ENTRY|EXIT
   * Reporte de movimientos en un rango de fechas
   */
  async getMovementsReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, type } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren los parámetros startDate y endDate (formato: YYYY-MM-DD)',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // Incluir todo el día final

      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const report = await reportService.getMovementsReport(start, end, type as any, branchId);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/reports/low-stock
   * Reporte de productos con stock bajo
   */
  async getLowStockReport(_req: Request, res: Response) {
    try {
      const report = await reportService.getLowStockReport();
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async getTopSelling(_req: Request, res: Response) {
    try {
      const report = await reportService.getTopSellingProducts();
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ReportController();
