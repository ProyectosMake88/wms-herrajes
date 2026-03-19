import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = '24h';

interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  organizationId?: number;
  branchId?: number;
}

interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterDTO) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Ya existe un usuario con ese email');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || UserRole.SELLER,
        organizationId: data.organizationId || null,
        branchId: data.branchId || null,
      },
      select: { id: true, email: true, name: true, role: true, branchId: true, isActive: true, createdAt: true },
    });

    return user;
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!user) throw new Error('Credenciales inválidas');
    if (!user.isActive) throw new Error('Usuario desactivado. Contacta al administrador');

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) throw new Error('Credenciales inválidas');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, organizationId: user.organizationId, branchId: user.branchId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId, branchId: user.branchId, branch: user.branch },
    };
  }

  async getAllUsers() {
    return prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, branchId: true, isActive: true, createdAt: true, branch: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: number, data: { name?: string; email?: string; role?: UserRole; branchId?: number | null; isActive?: boolean }) {
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
  }

  async deleteUser(id: number) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }

  /**
   * Crea el admin por defecto si no existe ningún usuario
   */
  async seedAdmin() {
    // Crear Super Admin si no existe ninguno
    const superAdmin = await prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN } });
    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash('Juankp88', 10);
      await prisma.user.create({
        data: {
          email: 'gerencia@makead.com.co',
          password: hashedPassword,
          name: 'Super Admin',
          role: UserRole.SUPER_ADMIN,
        },
      });
      console.log('👑 Super Admin creado: gerencia@makead.com.co');
    }
  }
}

export default new AuthService();
