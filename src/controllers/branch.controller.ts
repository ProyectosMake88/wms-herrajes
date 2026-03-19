import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import branchService from '../services/branch.service';

export class BranchController {
  async getAll(_req: AuthRequest, res: Response) {
    try {
      const branches = await branchService.findAll();
      res.json({ success: true, data: branches });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const branch = await branchService.findById(Number(req.params.id));
      if (!branch) return res.status(404).json({ success: false, message: 'Sede no encontrada' });
      res.json({ success: true, data: branch });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const branch = await branchService.create(req.body);
      res.status(201).json({ success: true, data: branch });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const branch = await branchService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: branch });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await branchService.delete(Number(req.params.id));
      res.json({ success: true, message: 'Sede desactivada' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new BranchController();
