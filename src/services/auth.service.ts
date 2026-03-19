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
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    return user;
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Credenciales inválidas');
    if (!user.isActive) throw new Error('Usuario desactivado. Contacta al administrador');

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) throw new Error('Credenciales inválidas');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async getAllUsers() {
    return prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: number, data: { name?: string; role?: UserRole; isActive?: boolean }) {
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
    const count = await prisma.user.count();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash('Juankp88', 10);
      await prisma.user.create({
        data: {
          email: 'gerencia@makead.com.co',
          password: hashedPassword,
          name: 'Gerencia',
          role: UserRole.ADMIN,
        },
      });
      console.log('👤 Usuario admin creado: gerencia@makead.com.co');
    }
  }
}

export default new AuthService();
