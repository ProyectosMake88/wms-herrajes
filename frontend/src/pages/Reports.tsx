import { useEffect, useState } from 'react';
import {
  BarChart3, Download, Calendar, ArrowDownToLine,
  ArrowUpFromLine, Package, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import Header from '../components/Layout/Header';
import StatsCard from '../components/ui/StatsCard';
import { reportApi } from '../services/api';
import { StockReport, MovementsReport } from '../types';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [movementsReport, setMovementsReport] = useState<MovementsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadStockReport(); }, []);

  async function loadStockReport() {
    setLoading(true);
    try {
      const res = await reportApi.getStockReport();
      setStockReport(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMovementsReport() {
    setLoading(true);
    try {
      const res = await reportApi.getMovementsReport(dateRange.startDate, dateRange.endDate);
      setMovementsReport(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab: 'stock' | 'movements') {
    setActiveTab(tab);
    if (tab === 'movements' && !movementsReport) {
      loadMovementsReport();
    }
  }

  const categoryChartData = stockReport
    ? Object.entries(stockReport.summary.byCategory).map(([name, data]) => ({
        name,
        productos: data.count,
        stockBajo: data.lowStock,
      }))
    : [];

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Reportes" subtitle="Análisis y reportes del inventario" />

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => handleTabChange('stock')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'stock' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          <Package className="w-4 h-4" /> Existencias
        </button>
        <button onClick={() => handleTabChange('movements')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'movements' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          <BarChart3 className="w-4 h-4" /> Movimientos
        </button>
      </div>

      {/* Stock Report */}
      {activeTab === 'stock' && stockReport && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <StatsCard title="Total Productos" value={stockReport.summary.totalProducts} icon={<Package className="w-6 h-6" />} color="purple" />
            <StatsCard title="Stock Bajo" value={stockReport.summary.totalLowStock} icon={<AlertTriangle className="w-6 h-6" />} color="orange" subtitle="Productos por debajo del mínimo" />
            <StatsCard title="Sin Stock" value={stockReport.summary.totalOutOfStock} icon={<Package className="w-6 h-6" />} color="red" subtitle="Agotados" />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">Productos por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="productos" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Total" />
                <Bar dataKey="stockBajo" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Stock Bajo" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">Detalle de Existencias</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Mínimo</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stockReport.products.map((p) => (
                    <tr key={p.id} className="table-row-hover">
                      <td className="px-6 py-3 text-sm font-mono text-primary-600">{p.sku}</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{p.category?.name}</td>
                      <td className={`px-6 py-3 text-sm font-bold text-right ${p.isLowStock ? 'text-red-500' : 'text-gray-800'}`}>{p.currentStock}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-500">{p.minimumStock}</td>
                      <td className="px-6 py-3 text-center">
                        {p.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Bajo
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movements Report */}
      {activeTab === 'movements' && (
        <div>
          {/* Date Range Filter */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <button onClick={loadMovementsReport}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
                Generar Reporte
              </button>
            </div>
          </div>

          {movementsReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <StatsCard title="Total Movimientos" value={movementsReport.summary.totalMovements} icon={<BarChart3 className="w-6 h-6" />} color="purple" />
                <StatsCard title="Entradas" value={movementsReport.summary.totalEntries} icon={<ArrowDownToLine className="w-6 h-6" />} color="green" subtitle={`${movementsReport.summary.totalEntryQuantity} unidades`} />
                <StatsCard title="Salidas" value={movementsReport.summary.totalExits} icon={<ArrowUpFromLine className="w-6 h-6" />} color="red" subtitle={`${movementsReport.summary.totalExitQuantity} unidades`} />
                <StatsCard title="Balance Neto" value={movementsReport.summary.totalEntryQuantity - movementsReport.summary.totalExitQuantity} icon={<Package className="w-6 h-6" />} color="blue" subtitle="Diferencia E/S" />
              </div>

              {/* Movements Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-800">
                    Movimientos del {new Date(dateRange.startDate).toLocaleDateString('es-CO')} al {new Date(dateRange.endDate).toLocaleDateString('es-CO')}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Responsable</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {movementsReport.movements.map((m) => (
                        <tr key={m.id} className="table-row-hover">
                          <td className="px-6 py-3">
                            {m.type === 'ENTRY' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                                <ArrowDownToLine className="w-3 h-3" /> Entrada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                                <ArrowUpFromLine className="w-3 h-3" /> Salida
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">{m.product?.name}</td>
                          <td className="px-6 py-3 text-sm font-bold text-right">{m.quantity}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{m.reason}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{m.responsible}</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{new Date(m.createdAt).toLocaleDateString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
