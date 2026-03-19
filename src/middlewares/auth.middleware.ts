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
    organizationId: number | null;
    branchId: number | null;
  };
}

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

/** Solo SUPER_ADMIN (dueño de la plataforma) */
export function superAdminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Super Administrador' });
  }
  next();
}

/** ADMIN de organización o SUPER_ADMIN */
export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
}

/** Vendedores solo pueden registrar salidas */
export function sellerExitOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === UserRole.SELLER && req.body.type !== 'EXIT') {
    return res.status(403).json({
      success: false,
      message: 'Los vendedores solo pueden registrar salidas (ventas)',
    });
  }
  next();
}
