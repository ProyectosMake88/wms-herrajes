import { UnitOfMeasure } from '@prisma/client';
import prisma from '../config/database';

interface CreateProductDTO {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: number;
  unitOfMeasure: UnitOfMeasure;
  currentStock?: number;
  minimumStock?: number;
  imageUrl?: string;
  warehouseLocation?: string;
  price?: number;
}

interface UpdateProductDTO {
  name?: string;
  description?: string;
  barcode?: string;
  categoryId?: number;
  unitOfMeasure?: UnitOfMeasure;
  minimumStock?: number;
  imageUrl?: string;
  warehouseLocation?: string;
  price?: number;
  isActive?: boolean;
}

export class ProductService {
  async findAll(filters?: { categoryId?: number; isLowStock?: boolean; isActive?: boolean }) {
    const where: any = {};
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.isLowStock !== undefined) where.isLowStock = filters.isLowStock;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        movements: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
      include: { category: true },
    });
  }

  async create(data: CreateProductDTO) {
    const isLowStock = (data.currentStock ?? 0) < (data.minimumStock ?? 100);
    return prisma.product.create({
      data: { ...data, isLowStock },
      include: { category: true },
    });
  }

  async update(id: number, data: UpdateProductDTO) {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: number) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getLowStockProducts() {
    return prisma.product.findMany({
      where: { isLowStock: true, isActive: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { currentStock: 'asc' },
    });
  }
}

export default new ProductService();
