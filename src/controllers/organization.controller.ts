import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import organizationService from '../services/organization.service';

export class OrganizationController {
  async getAll(_req: AuthRequest, res: Response) {
    try {
      const orgs = await organizationService.findAll();
      res.json({ success: true, data: orgs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const org = await organizationService.findById(Number(req.params.id));
      if (!org) return res.status(404).json({ success: false, message: 'Organización no encontrada' });
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const org = await organizationService.create(req.body);
      res.status(201).json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const data = { ...req.body };
      if (req.file) data.logoUrl = `/uploads/company/${req.file.filename}`;
      const org = await organizationService.update(Number(req.params.id), data);
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async toggleActive(req: AuthRequest, res: Response) {
    try {
      const org = await organizationService.toggleActive(Number(req.params.id));
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getStats(_req: AuthRequest, res: Response) {
    try {
      const stats = await organizationService.getStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new OrganizationController();
