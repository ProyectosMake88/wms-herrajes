import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
    name: string;
  };
}

/**
 * Middleware que verifica el token JWT.
 * Todas las rutas protegidas deben usar este middleware.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

/**
 * Middleware que restringe el acceso solo a administradores.
 * Debe usarse DESPUÉS de authMiddleware.
 */
export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
}

/**
 * Middleware que permite solo registrar salidas para vendedores.
 * Admins pueden registrar cualquier tipo de movimiento.
 */
export function sellerExitOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === UserRole.SELLER && req.body.type !== 'EXIT') {
    return res.status(403).json({
      success: false,
      message: 'Los vendedores solo pueden registrar salidas (ventas)',
    });
  }
  next();
}
