import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';

interface CreateOrgDTO {
  name: string;
  nit?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  planType?: string;
  // Admin de la org
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export class OrganizationService {
  async findAll() {
    return prisma.organization.findMany({
      include: {
        _count: { select: { users: true, branches: true, products: true, movements: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, isActive: true, branch: { select: { name: true } } } },
        branches: { select: { id: true, name: true, code: true, city: true, isActive: true } },
        _count: { select: { products: true, movements: true, categories: true } },
      },
    });
  }

  /** Crea una organización + su admin automáticamente */
  async create(data: CreateOrgDTO) {
    const existingOrg = data.nit ? await prisma.organization.findUnique({ where: { nit: data.nit } }) : null;
    if (existingOrg) throw new Error('Ya existe una organización con ese NIT');

    const existingUser = await prisma.user.findUnique({ where: { email: data.adminEmail } });
    if (existingUser) throw new Error('Ya existe un usuario con ese email');

    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

    const org = await prisma.$transaction(async (tx) => {
      // Crear organización
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          nit: data.nit,
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
          planType: data.planType || 'basic',
        },
      });

      // Crear admin de la organización
      await tx.user.create({
        data: {
          email: data.adminEmail,
          password: hashedPassword,
          name: data.adminName,
          role: UserRole.ADMIN,
          organizationId: organization.id,
        },
      });

      return organization;
    });

    return org;
  }

  async update(id: number, data: { name?: string; nit?: string; email?: string; phone?: string; address?: string; website?: string; planType?: string; logoUrl?: string; isActive?: boolean }) {
    return prisma.organization.update({ where: { id }, data });
  }

  async toggleActive(id: number) {
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) throw new Error('Organización no encontrada');
    return prisma.organization.update({
      where: { id },
      data: { isActive: !org.isActive },
    });
  }

  /** Estadísticas globales para super admin */
  async getStats() {
    const [orgs, users, products, movements] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.product.count(),
      prisma.movement.count(),
    ]);
    const activeOrgs = await prisma.organization.count({ where: { isActive: true } });
    return { totalOrgs: orgs, activeOrgs, totalUsers: users, totalProducts: products, totalMovements: movements };
  }
}

export default new OrganizationService();
