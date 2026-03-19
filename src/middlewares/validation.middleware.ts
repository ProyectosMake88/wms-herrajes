import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware para manejar errores de validación
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// Validaciones para Categorías
export const validateCategory = [
  body('name').trim().notEmpty().withMessage('El nombre de la categoría es obligatorio'),
  handleValidationErrors,
];

// Validaciones para Productos
export const validateProduct = [
  body('name').trim().notEmpty().withMessage('El nombre del producto es obligatorio'),
  body('sku').trim().notEmpty().withMessage('El SKU es obligatorio'),
  body('categoryId').isInt({ min: 1 }).withMessage('Se requiere un ID de categoría válido'),
  body('unitOfMeasure')
    .isIn(['UNIT', 'DOZEN', 'THOUSAND', 'KG', 'METER', 'BOX', 'PAIR'])
    .withMessage('Unidad de medida inválida. Opciones: UNIT, DOZEN, THOUSAND, KG, METER, BOX, PAIR'),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número positivo'),
  body('warehouseLocation').optional().trim(),
  body('price').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  handleValidationErrors,
];

// Validaciones para Movimientos
export const validateMovement = [
  body('productId').isInt({ min: 1 }).withMessage('Se requiere un ID de producto válido'),
  body('type').isIn(['ENTRY', 'EXIT']).withMessage('Tipo de movimiento inválido. Opciones: ENTRY, EXIT'),
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero positivo'),
  body('reason').trim().notEmpty().withMessage('El motivo del movimiento es obligatorio'),
  body('responsible').trim().notEmpty().withMessage('El usuario responsable es obligatorio'),
  handleValidationErrors,
];

// Validación de parámetro ID
export const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  handleValidationErrors,
];

// Validación para reportes por rango de fechas
export const validateDateRange = [
  query('startDate').isISO8601().withMessage('startDate debe ser una fecha válida (YYYY-MM-DD)'),
  query('endDate').isISO8601().withMessage('endDate debe ser una fecha válida (YYYY-MM-DD)'),
  handleValidationErrors,
];
