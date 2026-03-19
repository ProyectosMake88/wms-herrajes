export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  categoryId: number;
  unitOfMeasure: UnitOfMeasure;
  currentStock: number;
  minimumStock: number;
  isLowStock: boolean;
  imageUrl: string | null;
  warehouseLocation: string | null;
  cost: string | null;
  branchId: number | null;
  branch?: { id: number; name: string; code: string } | null;
  price: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string };
  movements?: Movement[];
}

export interface Movement {
  id: number;
  productId: number;
  type: 'ENTRY' | 'EXIT';
  quantity: number;
  salePrice: string | null;
  saleTotal: string | null;
  reason: string;
  responsible: string;
  notes: string | null;
  createdAt: string;
  product?: { id: number; name: string; sku: string; price?: string | null };
}

export type UnitOfMeasure = 'UNIT' | 'DOZEN' | 'THOUSAND' | 'KG' | 'METER' | 'BOX' | 'PAIR';

export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  UNIT: 'Unidad',
  DOZEN: 'Docena',
  THOUSAND: 'Millar',
  KG: 'Kilogramo',
  METER: 'Metro',
  BOX: 'Caja',
  PAIR: 'Par',
};

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  alert?: string | null;
}

export interface StockReport {
  summary: {
    totalProducts: number;
    totalLowStock: number;
    totalOutOfStock: number;
    byCategory: Record<string, { count: number; lowStock: number }>;
  };
  products: Product[];
}

export interface MovementsReport {
  summary: {
    totalMovements: number;
    totalEntries: number;
    totalExits: number;
    totalEntryQuantity: number;
    totalExitQuantity: number;
    totalSaleRevenue: number;
    totalCostOfSales: number;
    totalProfit: number;
    profitMargin: number;
    dateRange: { from: string; to: string };
  };
  movements: Movement[];
}
