import { NotificationType } from '@prisma/client';
import prisma from '../config/database';

export class NotificationService {
  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    productId?: number;
    userId?: number;
  }) {
    return prisma.notification.create({ data });
  }

  async getAll(limit = 30) {
    return prisma.notification.findMany({
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount() {
    return prisma.notification.count({ where: { isRead: false } });
  }

  async markAsRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead() {
    return prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }

  /** Genera notificación de stock bajo */
  async notifyLowStock(productName: string, sku: string, currentStock: number, minimumStock: number, productId: number) {
    return this.create({
      type: NotificationType.LOW_STOCK,
      title: 'Stock bajo',
      message: `"${productName}" (${sku}) tiene ${currentStock} unidades. Mínimo: ${minimumStock}`,
      productId,
    });
  }

  /** Genera notificación de producto agotado */
  async notifyOutOfStock(productName: string, sku: string, productId: number) {
    return this.create({
      type: NotificationType.OUT_OF_STOCK,
      title: 'Producto agotado',
      message: `"${productName}" (${sku}) se ha quedado sin stock`,
      productId,
    });
  }

  /** Genera notificación de venta registrada por vendedor */
  async notifySale(sellerName: string, productName: string, quantity: number, productId: number, userId: number) {
    return this.create({
      type: NotificationType.SALE,
      title: 'Venta registrada',
      message: `${sellerName} vendió ${quantity}x "${productName}"`,
      productId,
      userId,
    });
  }

  /** Genera notificación de entrada de inventario */
  async notifyEntry(userName: string, productName: string, quantity: number, productId: number, userId?: number) {
    return this.create({
      type: NotificationType.ENTRY,
      title: 'Entrada de inventario',
      message: `${userName} registró entrada de ${quantity}x "${productName}"`,
      productId,
      userId,
    });
  }
}

export default new NotificationService();
