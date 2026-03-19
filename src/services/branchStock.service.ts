import prisma from '../config/database';

export class BranchStockService {
  /** Asignar stock de un producto a una sede */
  async assignStock(productId: number, branchId: number, quantity: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Producto no encontrado');

    // Calcular stock ya asignado a todas las sedes
    const assigned = await prisma.branchStock.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    const totalAssigned = assigned._sum.quantity || 0;
    const available = product.currentStock - totalAssigned;

    if (quantity > available) {
      throw new Error(`Stock insuficiente. Disponible para asignar: ${available} (Total: ${product.currentStock}, Ya asignado: ${totalAssigned})`);
    }

    // Upsert: si ya tiene stock en esa sede, sumar
    const existing = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId, productId } },
    });

    if (existing) {
      return prisma.branchStock.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      return prisma.branchStock.create({
        data: { branchId, productId, quantity },
      });
    }
  }

  /** Obtener stock de una sede */
  async getByBranch(branchId: number) {
    return prisma.branchStock.findMany({
      where: { branchId, quantity: { gt: 0 } },
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });
  }

  /** Obtener stock disponible para asignar de un producto */
  async getAvailableStock(productId: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return 0;
    const assigned = await prisma.branchStock.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return product.currentStock - (assigned._sum.quantity || 0);
  }

  /** Obtener todos los productos con su stock disponible */
  async getProductsWithAvailability(organizationId?: number) {
    const where: any = { isActive: true };
    if (organizationId) where.organizationId = organizationId;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        branchStocks: { select: { branchId: true, quantity: true } },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => {
      const totalAssigned = p.branchStocks.reduce((sum, bs) => sum + bs.quantity, 0);
      return {
        ...p,
        totalAssigned,
        availableStock: p.currentStock - totalAssigned,
      };
    });
  }

  /** Reducir stock de una sede (venta) */
  async reduceStock(productId: number, branchId: number, quantity: number) {
    const stock = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId, productId } },
    });
    if (!stock || stock.quantity < quantity) {
      throw new Error(`Stock insuficiente en esta sede. Disponible: ${stock?.quantity || 0}`);
    }
    return prisma.branchStock.update({
      where: { id: stock.id },
      data: { quantity: stock.quantity - quantity },
    });
  }
}

export default new BranchStockService();
