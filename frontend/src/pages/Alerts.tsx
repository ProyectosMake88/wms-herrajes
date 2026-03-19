import { useEffect, useState } from 'react';
import { AlertTriangle, Package, ArrowRight, TrendingDown } from 'lucide-react';
import Header from '../components/Layout/Header';
import StatsCard from '../components/ui/StatsCard';
import { reportApi } from '../services/api';
import { Product, UNIT_LABELS } from '../types';

interface LowStockProduct extends Product {
  deficit: number;
}

export default function Alerts() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  async function loadAlerts() {
    try {
      const res = await reportApi.getLowStockReport();
      setProducts(res.data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Alertas de Stock" subtitle="Productos que requieren reabastecimiento" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatsCard
          title="Productos en Alerta"
          value={products.length}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="orange"
          subtitle="Por debajo del stock mínimo"
        />
        <StatsCard
          title="Déficit Total"
          value={products.reduce((sum, p) => sum + p.deficit, 0)}
          icon={<TrendingDown className="w-6 h-6" />}
          color="red"
          subtitle="Unidades necesarias"
        />
        <StatsCard
          title="Productos Agotados"
          value={products.filter((p) => p.currentStock === 0).length}
          icon={<Package className="w-6 h-6" />}
          color="red"
          subtitle="Stock en cero"
        />
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Todo en orden</h3>
          <p className="text-sm text-gray-500 mt-1">No hay productos con stock bajo en este momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow border-l-4 border-l-amber-400">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-red-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-red-400 font-medium uppercase">Actual</p>
                  <p className="text-lg font-bold text-red-600">{product.currentStock}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Mínimo</p>
                  <p className="text-lg font-bold text-gray-600">{product.minimumStock}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-amber-400 font-medium uppercase">Déficit</p>
                  <p className="text-lg font-bold text-amber-600">{product.deficit}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>{product.category?.name}</span>
                <span>{product.warehouseLocation || 'Sin ubicación'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
