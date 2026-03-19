import prisma from '../config/database';

interface CreateBranchDTO {
  name: string;
  code: string;
  address?: string;
  city?: string;
  phone?: string;
  manager?: string;
}

export class BranchService {
  async findAll() {
    return prisma.branch.findMany({
      include: {
        _count: { select: { users: true, products: true, movements: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.branch.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        _count: { select: { products: true, movements: true } },
      },
    });
  }

  async create(data: CreateBranchDTO) {
    return prisma.branch.create({ data });
  }

  async update(id: number, data: Partial<CreateBranchDTO> & { isActive?: boolean }) {
    return prisma.branch.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.branch.update({ where: { id }, data: { isActive: false } });
  }
}

export default new BranchService();
