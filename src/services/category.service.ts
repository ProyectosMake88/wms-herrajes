import prisma from '../config/database';

export class CategoryService {
  async findAll() {
    return prisma.category.findMany({
      include: { products: { select: { id: true, name: true, sku: true, currentStock: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  async create(data: { name: string; description?: string }) {
    return prisma.category.create({ data });
  }

  async update(id: number, data: { name?: string; description?: string }) {
    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.category.delete({ where: { id } });
  }
}

export default new CategoryService();
