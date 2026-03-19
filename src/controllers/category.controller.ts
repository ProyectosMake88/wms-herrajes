import { Request, Response } from 'express';
import categoryService from '../services/category.service';

export class CategoryController {
  async getAll(_req: Request, res: Response) {
    try {
      const categories = await categoryService.findAll();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const category = await categoryService.findById(Number(req.params.id));
      if (!category) {
        return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
      }
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const category = await categoryService.create(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const category = await categoryService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await categoryService.delete(Number(req.params.id));
      res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new CategoryController();
