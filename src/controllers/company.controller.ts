import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import companyService from '../services/company.service';

export class CompanyController {
  async getProfile(_req: AuthRequest, res: Response) {
    try {
      const company = await companyService.getProfile();
      res.json({ success: true, data: company });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const data = { ...req.body };

      // Si se subió un logo
      if (req.file) {
        data.logoUrl = `/uploads/company/${req.file.filename}`;
      }

      const company = await companyService.updateProfile(data);
      res.json({ success: true, data: company });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new CompanyController();
