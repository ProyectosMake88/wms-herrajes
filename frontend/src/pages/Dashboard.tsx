import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Tags, ArrowDownToLine, ArrowUpFromLine,
  AlertTriangle, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Header from '../components/Layout/Header';
import StatsCard from '../components/ui/StatsCard';
import { reportApi, productApi, categoryApi } from '../services/api';
import { Product, Category } from '../types';

const PIE_COLORS = ['#7c3aed', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, categories: 0 });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [movementChart, setMovementChart] = useState<{ name: string; entradas: number; salidas: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [stockRes, catRes, productsRes] = await Promise.all([
        reportApi.getStockReport(),
        categoryApi.getAll(),
        productApi.getAll(),
      ]);

      const stock = stockRes.data;
      const categories: Category[] = catRes.data;
      const products: Product[] = productsRes.data;

      setStats({
        total: stock.summary.totalProducts,
        lowStock: stock.summary.totalLowStock,
        outOfStock: stock.summary.totalOutOfStock,
        categories: categories.length,
      });

      setCategoryData(
        Object.entries(stock.summary.byCategory).map(([name, val]: [string, any]) => ({
          name,
          value: val.count,
        }))
      );

      setRecentProducts(products.slice(0, 6));

      // Simulated movement chart data from categories
      setMovementChart(
        categories.map((c: any) => ({
          name: c.name.substring(0, 12),
          entradas: Math.floor(Math.random() * 200) + 50,
          salidas: Math.floor(Math.random() * 150) + 30,
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Resumen general del inventario de herrajes" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatsCard title="Total Productos" value={stats.total} icon={<Package className="w-6 h-6" />} color="purple" subtitle="Productos activos" />
        <StatsCard title="Categorías" value={stats.categories} icon={<Tags className="w-6 h-6" />} color="blue" subtitle="Categorías registradas" />
        <StatsCard title="Stock Bajo" value={stats.lowStock} icon={<AlertTriangle className="w-6 h-6" />} color="orange" subtitle="Requieren atención" />
        <StatsCard title="Sin Stock" value={stats.outOfStock} icon={<TrendingUp className="w-6 h-6" />} color="red" subtitle="Agotados" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Movimientos Recientes</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-primary-500 rounded-sm" /> Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-400 rounded-sm" /> Salidas
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={movementChart} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="entradas" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              <Bar dataKey="salidas" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-4">Productos por Categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">Productos Recientes</h3>
          <Link to="/products" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentProducts.map((product) => (
                <tr key={product.id} className="table-row-hover transition-colors">
                  <td className="px-6 py-3.5 text-sm font-mono text-gray-600">{product.sku}</td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">{product.category?.name}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">{product.warehouseLocation || '—'}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-right text-gray-800">{product.currentStock}</td>
                  <td className="px-6 py-3.5 text-center">
                    {product.isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Bajo
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
