import { MovementType } from '@prisma/client';
import prisma from '../config/database';

export class ReportService {
  /**
   * Reporte General de Existencias
   * Retorna todos los productos con su stock actual, categoría y estado
   */
  async getStockReport() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    const summary = {
      totalProducts: products.length,
      totalLowStock: products.filter((p) => p.isLowStock).length,
      totalOutOfStock: products.filter((p) => p.currentStock === 0).length,
      byCategory: {} as Record<string, { count: number; lowStock: number }>,
    };

    for (const product of products) {
      const catName = product.category.name;
      if (!summary.byCategory[catName]) {
        summary.byCategory[catName] = { count: 0, lowStock: 0 };
      }
      summary.byCategory[catName].count++;
      if (product.isLowStock) summary.byCategory[catName].lowStock++;
    }

    return { summary, products };
  }

  /**
   * Reporte filtrado por Categoría
   */
  async getStockByCategory(categoryId: number) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error(`Categoría con ID ${categoryId} no encontrada`);

    const products = await prisma.product.findMany({
      where: { categoryId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return {
      category: category.name,
      totalProducts: products.length,
      lowStockCount: products.filter((p) => p.isLowStock).length,
      products,
    };
  }

  /**
   * Reporte de movimientos (Entradas/Salidas) en un rango de fechas
   */
  async getMovementsReport(startDate: Date, endDate: Date, type?: MovementType) {
    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    };
    if (type) where.type = type;

    const movements = await prisma.movement.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalMovements: movements.length,
      totalEntries: movements.filter((m) => m.type === MovementType.ENTRY).length,
      totalExits: movements.filter((m) => m.type === MovementType.EXIT).length,
      totalEntryQuantity: movements
        .filter((m) => m.type === MovementType.ENTRY)
        .reduce((sum, m) => sum + m.quantity, 0),
      totalExitQuantity: movements
        .filter((m) => m.type === MovementType.EXIT)
        .reduce((sum, m) => sum + m.quantity, 0),
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
    };

    return { summary, movements };
  }

  /**
   * Reporte de productos con stock bajo
   */
  async getLowStockReport() {
    const products = await prisma.product.findMany({
      where: { isLowStock: true, isActive: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { currentStock: 'asc' },
    });

    return {
      totalLowStock: products.length,
      products: products.map((p) => ({
        ...p,
        deficit: p.minimumStock - p.currentStock,
      })),
    };
  }
}

export default new ReportService();
