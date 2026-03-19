import { PendingStatus, NotificationType } from '@prisma/client';
import prisma from '../config/database';
import inventoryService from './inventory.service';
import notificationService from './notification.service';

interface CreatePendingEntryDTO {
  productId: number;
  userId: number;
  quantity: number;
  reason: string;
  notes?: string;
}

export class PendingEntryService {
  async create(data: CreatePendingEntryDTO) {
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error('Producto no encontrado');

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error('Usuario no encontrado');

    const entry = await prisma.pendingEntry.create({
      data,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // Notificar al admin
    await notificationService.create({
      type: NotificationType.PENDING_ENTRY,
      title: 'Solicitud de entrada',
      message: `${user.name} solicita entrada de ${data.quantity}x "${product.name}" (${product.sku}). Motivo: ${data.reason}`,
      productId: data.productId,
      userId: data.userId,
    });

    return entry;
  }

  async getAll(status?: PendingStatus) {
    const where = status ? { status } : {};
    return prisma.pendingEntry.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, imageUrl: true, currentStock: true } },
        user: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingCount() {
    return prisma.pendingEntry.count({ where: { status: PendingStatus.PENDING } });
  }

  async approve(id: number, reviewerId: number) {
    const entry = await prisma.pendingEntry.findUnique({
      where: { id },
      include: { product: true, user: true },
    });
    if (!entry) throw new Error('Solicitud no encontrada');
    if (entry.status !== PendingStatus.PENDING) throw new Error('Esta solicitud ya fue procesada');

    // Actualizar estado
    const updated = await prisma.pendingEntry.update({
      where: { id },
      data: { status: PendingStatus.APPROVED, reviewedBy: reviewerId, reviewedAt: new Date() },
    });

    // Ejecutar la entrada de inventario
    await inventoryService.registerMovement({
      productId: entry.productId,
      type: 'ENTRY',
      quantity: entry.quantity,
      reason: entry.reason,
      responsible: entry.user.name,
      notes: `Aprobado desde solicitud #${id}. ${entry.notes || ''}`,
      userId: entry.userId,
    });

    // Notificar al vendedor que fue aprobada
    await notificationService.create({
      type: NotificationType.ENTRY_APPROVED,
      title: 'Entrada aprobada',
      message: `Tu solicitud de entrada de ${entry.quantity}x "${entry.product.name}" fue aprobada`,
      productId: entry.productId,
      userId: entry.userId,
    });

    return updated;
  }

  async reject(id: number, reviewerId: number, rejectReason: string) {
    const entry = await prisma.pendingEntry.findUnique({
      where: { id },
      include: { product: true, user: true },
    });
    if (!entry) throw new Error('Solicitud no encontrada');
    if (entry.status !== PendingStatus.PENDING) throw new Error('Esta solicitud ya fue procesada');

    const updated = await prisma.pendingEntry.update({
      where: { id },
      data: { status: PendingStatus.REJECTED, reviewedBy: reviewerId, reviewedAt: new Date(), rejectReason },
    });

    // Notificar al vendedor que fue rechazada
    await notificationService.create({
      type: NotificationType.ENTRY_REJECTED,
      title: 'Entrada rechazada',
      message: `Tu solicitud de entrada de ${entry.quantity}x "${entry.product.name}" fue rechazada. Motivo: ${rejectReason}`,
      productId: entry.productId,
      userId: entry.userId,
    });

    return updated;
  }
}

export default new PendingEntryService();
