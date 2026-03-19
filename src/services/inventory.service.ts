import { MovementType } from '@prisma/client';
import prisma from '../config/database';

interface RegisterMovementDTO {
  productId: number;
  type: MovementType;
  quantity: number;
  reason: string;
  responsible: string;
  notes?: string;
}

export class InventoryService {
  /**
   * Registra un movimiento de inventario (Entrada o Salida).
   * - ENTRY: aumenta el stock del producto.
   * - EXIT: disminuye el stock del producto.
   * Luego evalúa si el producto queda en estado "Low Stock".
   */
  async registerMovement(data: RegisterMovementDTO) {
    const { productId, type, quantity, reason, responsible, notes } = data;

    // Validar que el producto existe
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    // Validar stock suficiente para salidas
    if (type === MovementType.EXIT && product.currentStock < quantity) {
      throw new Error(
        `Stock insuficiente. Stock actual: ${product.currentStock}, cantidad solicitada: ${quantity}`
      );
    }

    // Transacción atómica: crear movimiento + actualizar stock + evaluar alerta
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el movimiento
      const movement = await tx.movement.create({
        data: { productId, type, quantity, reason, responsible, notes },
      });

      // 2. Calcular nuevo stock
      const stockChange = type === MovementType.ENTRY ? quantity : -quantity;
      const newStock = product.currentStock + stockChange;

      // 3. Evaluar flag de Low Stock
      const isLowStock = newStock < product.minimumStock;

      // 4. Actualizar producto
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: newStock,
          isLowStock,
        },
        include: { category: true },
      });

      return { movement, product: updatedProduct };
    });

    return result;
  }

  /**
   * Obtener historial de movimientos de un producto
   */
  async getMovementsByProduct(productId: number) {
    return prisma.movement.findMany({
      where: { productId },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener todos los movimientos con filtros opcionales
   */
  async getMovements(filters?: { type?: MovementType; productId?: number }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.productId) where.productId = filters.productId;

    return prisma.movement.findMany({
      where,
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new InventoryService();
