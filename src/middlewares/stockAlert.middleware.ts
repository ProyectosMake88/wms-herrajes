import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

/**
 * Middleware que evalúa el estado de stock de un producto después de un movimiento.
 * Si el stock cae por debajo del mínimo configurado, marca el producto con isLowStock = true.
 *
 * Este middleware se ejecuta DESPUÉS de registrar un movimiento (en la respuesta).
 * La lógica principal de alerta está en inventory.service.ts dentro de la transacción,
 * pero este middleware sirve como capa adicional de verificación y logging.
 */
export async function stockAlertMiddleware(req: Request, res: Response, next: NextFunction) {
  // Interceptar la respuesta para agregar alertas
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    // Si la respuesta incluye un producto con low stock, agregar alerta visible
    if (body?.data?.product?.isLowStock) {
      const product = body.data.product;
      console.warn(
        `⚠️  ALERTA STOCK BAJO: "${product.name}" (SKU: ${product.sku}) - ` +
          `Stock: ${product.currentStock} | Mínimo: ${product.minimumStock}`
      );
    }
    return originalJson(body);
  };

  next();
}

/**
 * Función para verificar y actualizar alertas de stock en batch.
 * Útil para ejecutar periódicamente o después de importaciones masivas.
 */
export async function evaluateAllStockAlerts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, currentStock: true, minimumStock: true, isLowStock: true },
  });

  let alertsUpdated = 0;
  for (const product of products) {
    const shouldBeLowStock = product.currentStock < product.minimumStock;
    if (product.isLowStock !== shouldBeLowStock) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isLowStock: shouldBeLowStock },
      });
      alertsUpdated++;
    }
  }

  return { totalEvaluated: products.length, alertsUpdated };
}
