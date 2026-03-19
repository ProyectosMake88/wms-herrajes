import { PrismaClient, UnitOfMeasure, MovementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear categorías de herrajes
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Bisagras' },
      update: {},
      create: { name: 'Bisagras', description: 'Bisagras de todo tipo para puertas, ventanas y muebles' },
    }),
    prisma.category.upsert({
      where: { name: 'Cerraduras' },
      update: {},
      create: { name: 'Cerraduras', description: 'Cerraduras, candados y sistemas de seguridad' },
    }),
    prisma.category.upsert({
      where: { name: 'Tornillería' },
      update: {},
      create: { name: 'Tornillería', description: 'Tornillos, tuercas, arandelas y pernos' },
    }),
    prisma.category.upsert({
      where: { name: 'Manillas y Tiradores' },
      update: {},
      create: { name: 'Manillas y Tiradores', description: 'Manillas, tiradores y pomos para puertas y muebles' },
    }),
    prisma.category.upsert({
      where: { name: 'Correderas y Rieles' },
      update: {},
      create: { name: 'Correderas y Rieles', description: 'Sistemas de correderas y rieles para cajones y puertas' },
    }),
  ]);

  // Crear productos de ejemplo
  const products = [
    { name: 'Bisagra Cazoleta 35mm', sku: 'BIS-CAZ-35', categoryId: categories[0].id, unitOfMeasure: UnitOfMeasure.UNIT, currentStock: 500, minimumStock: 100, warehouseLocation: 'Pasillo A, Estante 1', price: 2.50 },
    { name: 'Bisagra Piano 2"', sku: 'BIS-PIA-2', categoryId: categories[0].id, unitOfMeasure: UnitOfMeasure.UNIT, currentStock: 80, minimumStock: 100, warehouseLocation: 'Pasillo A, Estante 2', price: 5.00, isLowStock: true },
    { name: 'Cerradura Multipunto 3 Golpes', sku: 'CER-MUL-3G', categoryId: categories[1].id, unitOfMeasure: UnitOfMeasure.UNIT, currentStock: 200, minimumStock: 50, warehouseLocation: 'Pasillo B, Estante 1', price: 45.00 },
    { name: 'Tornillo Drywall 6x1"', sku: 'TOR-DRY-6X1', categoryId: categories[2].id, unitOfMeasure: UnitOfMeasure.THOUSAND, currentStock: 50, minimumStock: 100, warehouseLocation: 'Pasillo C, Estante 3', price: 12.00, isLowStock: true },
    { name: 'Manilla Tubular Acero Inox', sku: 'MAN-TUB-INOX', categoryId: categories[3].id, unitOfMeasure: UnitOfMeasure.PAIR, currentStock: 150, minimumStock: 30, warehouseLocation: 'Pasillo D, Estante 1', price: 18.50 },
    { name: 'Corredera Telescópica 45cm', sku: 'COR-TEL-45', categoryId: categories[4].id, unitOfMeasure: UnitOfMeasure.PAIR, currentStock: 300, minimumStock: 100, warehouseLocation: 'Pasillo E, Estante 2', price: 8.75 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  // Crear movimientos de ejemplo
  const allProducts = await prisma.product.findMany();
  for (const product of allProducts) {
    await prisma.movement.create({
      data: {
        productId: product.id,
        type: MovementType.ENTRY,
        quantity: product.currentStock,
        reason: 'Inventario inicial',
        responsible: 'Admin Sistema',
      },
    });
  }

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
