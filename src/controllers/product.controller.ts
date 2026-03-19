import { Request, Response } from 'express';
import productService from '../services/product.service';

export class ProductController {
  async getAll(req: Request, res: Response) {
    try {
      const filters = {
        categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
        isLowStock: req.query.isLowStock === 'true' ? true : req.query.isLowStock === 'false' ? false : undefined,
        isActive: req.query.isActive === 'false' ? false : true,
      };
      const products = await productService.findAll(filters);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const product = await productService.findById(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBySku(req: Request, res: Response) {
    try {
      const product = await productService.findBySku(req.params.sku);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = { ...req.body };
      // Convertir campos numéricos que vienen como string desde FormData
      if (data.categoryId) data.categoryId = Number(data.categoryId);
      if (data.currentStock) data.currentStock = Number(data.currentStock);
      if (data.minimumStock) data.minimumStock = Number(data.minimumStock);
      if (data.cost) data.cost = Number(data.cost);
      if (data.price) data.price = Number(data.price);

      // Si se subió una imagen, guardar la ruta
      if (req.file) {
        data.imageUrl = `/uploads/products/${req.file.filename}`;
      }

      const product = await productService.create(data);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = { ...req.body };
      if (data.categoryId) data.categoryId = Number(data.categoryId);
      if (data.minimumStock) data.minimumStock = Number(data.minimumStock);
      if (data.cost) data.cost = Number(data.cost);
      if (data.price) data.price = Number(data.price);

      if (req.file) {
        data.imageUrl = `/uploads/products/${req.file.filename}`;
      }

      const product = await productService.update(Number(req.params.id), data);
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await productService.delete(Number(req.params.id));
      res.json({ success: true, message: 'Producto desactivado' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLowStock(_req: Request, res: Response) {
    try {
      const products = await productService.getLowStockProducts();
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ProductController();
