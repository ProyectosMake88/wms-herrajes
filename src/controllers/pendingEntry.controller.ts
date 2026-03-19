import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import pendingEntryService from '../services/pendingEntry.service';

export class PendingEntryController {
  /** Vendedor crea solicitud de entrada */
  async create(req: AuthRequest, res: Response) {
    try {
      const entry = await pendingEntryService.create({
        productId: Number(req.body.productId),
        userId: req.user!.id,
        quantity: Number(req.body.quantity),
        reason: req.body.reason,
        notes: req.body.notes,
      });
      res.status(201).json({ success: true, data: entry, message: 'Solicitud enviada. Esperando aprobación del administrador.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /** Admin lista solicitudes */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as any;
      const entries = await pendingEntryService.getAll(status || undefined);
      const pendingCount = await pendingEntryService.getPendingCount();
      res.json({ success: true, data: { entries, pendingCount } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /** Admin aprueba solicitud */
  async approve(req: AuthRequest, res: Response) {
    try {
      const entry = await pendingEntryService.approve(Number(req.params.id), req.user!.id);
      res.json({ success: true, data: entry, message: 'Entrada aprobada y registrada en inventario' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /** Admin rechaza solicitud */
  async reject(req: AuthRequest, res: Response) {
    try {
      const entry = await pendingEntryService.reject(Number(req.params.id), req.user!.id, req.body.rejectReason || 'Sin motivo');
      res.json({ success: true, data: entry, message: 'Solicitud rechazada' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new PendingEntryController();
