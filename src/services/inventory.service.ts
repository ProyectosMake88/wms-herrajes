import { MovementType } from '@prisma/client';
import prisma from '../config/database';
import notificationService from './notification.service';

interface RegisterMovementDTO {
  productId: number;
  type: MovementType;
  quantity: number;
  reason: string;
  responsible: string;
  notes?: string;
  userId?: number;
}

export class InventoryService {
  /**
   * Registra un movimiento de inventario (Entrada o Salida).
   * Genera notificaciones automáticas para el admin.
   */
  async registerMovement(data: RegisterMovementDTO) {
    const { productId, type, quantity, reason, responsible, notes, userId } = data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    if (type === MovementType.EXIT && product.currentStock < quantity) {
      throw new Error(
        `Stock insuficiente. Stock actual: ${product.currentStock}, cantidad solicitada: ${quantity}`
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.movement.create({
        data: { productId, userId, type, quantity, reason, responsible, notes },
      });

      const stockChange = type === MovementType.ENTRY ? quantity : -quantity;
      const newStock = product.currentStock + stockChange;
      const isLowStock = newStock < product.minimumStock;

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock, isLowStock },
        include: { category: true },
      });

      return { movement, product: updatedProduct, newStock };
    });

    // Generar notificaciones (fuera de la transacción para no bloquearla)
    try {
      if (type === MovementType.EXIT) {
        await notificationService.notifySale(
          responsible, product.name, quantity, productId, userId || 0
        );
      } else {
        await notificationService.notifyEntry(
          responsible, product.name, quantity, productId, userId
        );
      }

      // Alerta de stock bajo
      if (result.product.isLowStock && !product.isLowStock) {
        // Pasó de normal a bajo — generar alerta
        if (result.newStock === 0) {
          await notificationService.notifyOutOfStock(product.name, product.sku, productId);
        } else {
          await notificationService.notifyLowStock(
            product.name, product.sku, result.newStock, product.minimumStock, productId
          );
        }
      } else if (result.newStock === 0) {
        await notificationService.notifyOutOfStock(product.name, product.sku, productId);
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    return result;
  }

  async getMovementsByProduct(productId: number) {
    return prisma.movement.findMany({
      where: { productId },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

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
