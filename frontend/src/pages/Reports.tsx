import { useEffect, useState } from 'react';
import {
  BarChart3, Download, Calendar, ArrowDownToLine,
  ArrowUpFromLine, Package, AlertTriangle, DollarSign, TrendingUp, FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '../components/Layout/Header';
import StatsCard from '../components/ui/StatsCard';
import { reportApi } from '../services/api';
import { StockReport, MovementsReport } from '../types';

function exportToXlsx(report: MovementsReport) {
  const s = report.summary;
  // Build XML Spreadsheet (compatible with Excel)
  const rows = report.movements.map((m: any) => {
    const saleTotal = m.saleTotal ? Number(m.saleTotal) : 0;
    const costTotal = m.product?.cost ? Number(m.product.cost) * m.quantity : 0;
    const profit = m.type === 'EXIT' ? saleTotal - costTotal : 0;
    return {
      Tipo: m.type === 'ENTRY' ? 'Entrada' : 'Salida',
      Producto: m.product?.name || '',
      SKU: m.product?.sku || '',
      Cantidad: m.quantity,
      'Venta Total': m.type === 'EXIT' ? saleTotal : '',
      'Costo Total': m.type === 'EXIT' ? costTotal : '',
      Utilidad: m.type === 'EXIT' ? profit : '',
      Motivo: m.reason,
      Responsable: m.responsible,
      Fecha: new Date(m.createdAt).toLocaleDateString('es-CO'),
    };
  });

  // Build HTML table for Excel
  const headers = Object.keys(rows[0] || {});
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8">
<style>
  table { border-collapse: collapse; font-family: Calibri, sans-serif; }
  th { background-color: #5b21b6; color: white; font-weight: bold; padding: 10px 14px; font-size: 12px; text-align: center; }
  td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 11px; text-align: center; }
  tr:nth-child(even) { background-color: #f5f3ff; }
  .title { font-size: 18px; font-weight: bold; color: #5b21b6; padding: 10px; }
  .subtitle { font-size: 12px; color: #6b7280; padding: 4px 10px; }
  .summary-label { font-weight: bold; padding: 6px 12px; text-align: right; background: #f9fafb; }
  .summary-value { font-weight: bold; padding: 6px 12px; font-size: 13px; }
  .green { color: #059669; }
  .red { color: #dc2626; }
  .blue { color: #2563eb; }
  .amber { color: #d97706; }
</style></head><body>`;

  // Title
  html += `<div class="title">Reporte de Movimientos - WMS Herrajes</div>`;
  html += `<div class="subtitle">Período: ${new Date(s.dateRange.from).toLocaleDateString('es-CO')} al ${new Date(s.dateRange.to).toLocaleDateString('es-CO')}</div><br/>`;

  // Summary table
  html += `<table><tr><td class="summary-label">Total Movimientos:</td><td class="summary-value">${s.totalMovements}</td>`;
  html += `<td class="summary-label">Entradas:</td><td class="summary-value green">${s.totalEntries} (${s.totalEntryQuantity} uds)</td></tr>`;
  html += `<tr><td class="summary-label">Salidas:</td><td class="summary-value red">${s.totalExits} (${s.totalExitQuantity} uds)</td>`;
  html += `<td class="summary-label">Ingresos por Ventas:</td><td class="summary-value blue">$${s.totalSaleRevenue.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td></tr>`;
  html += `<tr><td class="summary-label">Costo de Adquisición:</td><td class="summary-value amber">$${s.totalCostOfSales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>`;
  html += `<td class="summary-label">Utilidad Neta:</td><td class="summary-value ${s.totalProfit >= 0 ? 'green' : 'red'}">$${s.totalProfit.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td></tr>`;
  html += `<tr><td class="summary-label">Margen de Ganancia:</td><td class="summary-value ${s.profitMargin >= 0 ? 'green' : 'red'}">${s.profitMargin.toFixed(1)}%</td>`;
  html += `<td></td><td></td></tr></table><br/>`;

  // Data table
  html += '<table><thead><tr>';
  headers.forEach((h) => { html += `<th>${h}</th>`; });
  html += '</tr></thead><tbody>';
  rows.forEach((row: any) => {
    html += '<tr>';
    headers.forEach((h) => {
      const val = row[h];
      const isNum = typeof val === 'number';
      const isMoney = ['Venta Total', 'Costo Total', 'Utilidad'].includes(h) && val !== '';
      let cls = '';
      if (h === 'Utilidad' && val !== '') cls = Number(val) >= 0 ? 'green' : 'red';
      if (h === 'Venta Total') cls = 'blue';
      if (h === 'Costo Total') cls = 'amber';
      html += `<td class="${cls}">${isMoney ? '$' + Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : val}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Movimientos_${new Date().toISOString().split('T')[0]}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [movementsReport, setMovementsReport] = useState<MovementsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterType, setFilterType] = useState('');
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

  // Get unique responsibles from movements
  const uniqueResponsibles = movementsReport
    ? [...new Set(movementsReport.movements.map((m: any) => m.responsible))].sort()
    : [];

  // Filter movements
  const filteredMovements = movementsReport
    ? movementsReport.movements.filter((m: any) => {
        if (filterResponsible && m.responsible !== filterResponsible) return false;
        if (filterType && m.type !== filterType) return false;
        return true;
      })
    : [];

  // Recalculate summary for filtered data
  const filteredSummary = movementsReport ? (() => {
    const exits = filteredMovements.filter((m: any) => m.type === 'EXIT');
    const entries = filteredMovements.filter((m: any) => m.type === 'ENTRY');
    const totalSaleRevenue = exits.reduce((sum: number, m: any) => sum + (m.saleTotal ? Number(m.saleTotal) : 0), 0);
    const totalCostOfSales = exits.reduce((sum: number, m: any) => {
      const unitCost = m.product?.cost ? Number(m.product.cost) : 0;
      return sum + (unitCost * m.quantity);
    }, 0);
    const totalProfit = totalSaleRevenue - totalCostOfSales;
    return {
      ...movementsReport.summary,
      totalMovements: filteredMovements.length,
      totalEntries: entries.length,
      totalExits: exits.length,
      totalEntryQuantity: entries.reduce((sum: number, m: any) => sum + m.quantity, 0),
      totalExitQuantity: exits.reduce((sum: number, m: any) => sum + m.quantity, 0),
      totalSaleRevenue,
      totalCostOfSales,
      totalProfit,
      profitMargin: totalSaleRevenue > 0 ? (totalProfit / totalSaleRevenue) * 100 : 0,
    };
  })() : null;

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
            <div className="flex items-end gap-4 flex-wrap">
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
              <button onClick={() => { loadMovementsReport(); setFilterResponsible(''); setFilterType(''); }}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
                Generar Reporte
              </button>
            </div>

            {/* Filtros adicionales */}
            {movementsReport && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase">Filtrar por:</span>
                <select value={filterResponsible} onChange={(e) => setFilterResponsible(e.target.value)}
                  className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                  <option value="">Todos los responsables</option>
                  {uniqueResponsibles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                  <option value="">Todos los tipos</option>
                  <option value="ENTRY">Entradas</option>
                  <option value="EXIT">Salidas (Ventas)</option>
                </select>
                {(filterResponsible || filterType) && (
                  <button onClick={() => { setFilterResponsible(''); setFilterType(''); }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {movementsReport && filteredSummary && (
            <>
              {/* Active filter indicator */}
              {(filterResponsible || filterType) && (
                <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-center gap-2">
                  <span className="text-xs text-primary-700 font-medium">
                    Filtro activo: {filterResponsible && `Responsable: ${filterResponsible}`} {filterType && `Tipo: ${filterType === 'EXIT' ? 'Salidas' : 'Entradas'}`}
                    {' '}({filteredMovements.length} de {movementsReport.movements.length} movimientos)
                  </span>
                </div>
              )}

              {/* Movement Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                <StatsCard title="Total Movimientos" value={filteredSummary.totalMovements} icon={<BarChart3 className="w-6 h-6" />} color="purple" />
                <StatsCard title="Entradas" value={filteredSummary.totalEntries} icon={<ArrowDownToLine className="w-6 h-6" />} color="green" subtitle={`${filteredSummary.totalEntryQuantity} unidades`} />
                <StatsCard title="Salidas" value={filteredSummary.totalExits} icon={<ArrowUpFromLine className="w-6 h-6" />} color="red" subtitle={`${filteredSummary.totalExitQuantity} unidades`} />
                <StatsCard title="Balance Neto" value={filteredSummary.totalEntryQuantity - filteredSummary.totalExitQuantity} icon={<Package className="w-6 h-6" />} color="blue" subtitle="Diferencia E/S" />
              </div>

              {/* Financial Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Ingresos por Ventas</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${filteredSummary.totalSaleRevenue.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Costo de Adquisición</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${filteredSummary.totalCostOfSales.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filteredSummary.totalProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Utilidad Neta</p>
                  </div>
                  <p className={`text-2xl font-bold ${filteredSummary.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${filteredSummary.totalProfit.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filteredSummary.profitMargin >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Margen de Ganancia</p>
                  </div>
                  <p className={`text-2xl font-bold ${filteredSummary.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {filteredSummary.profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Movements Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-800">
                    Movimientos del {new Date(dateRange.startDate).toLocaleDateString('es-CO')} al {new Date(dateRange.endDate).toLocaleDateString('es-CO')}
                  </h3>
                  <button
                    onClick={() => exportToXlsx({ ...movementsReport, movements: filteredMovements, summary: filteredSummary! })}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Descargar XLSX
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Venta Total</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Costo Total</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Utilidad</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Responsable</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredMovements.map((m: any) => {
                        const saleTotal = m.saleTotal ? Number(m.saleTotal) : 0;
                        const costTotal = m.product?.cost ? Number(m.product.cost) * m.quantity : 0;
                        const profit = m.type === 'EXIT' ? saleTotal - costTotal : 0;
                        return (
                          <tr key={m.id} className="table-row-hover">
                            <td className="px-5 py-3 text-center">
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
                            <td className="px-5 py-3 text-sm font-medium text-gray-800 text-center">{m.product?.name}</td>
                            <td className="px-5 py-3 text-sm font-bold text-center">{m.quantity}</td>
                            <td className="px-5 py-3 text-sm font-semibold text-center text-blue-600">
                              {m.type === 'EXIT' && saleTotal ? `$${saleTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="px-5 py-3 text-sm font-semibold text-center text-amber-600">
                              {m.type === 'EXIT' && costTotal ? `$${costTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="px-5 py-3 text-sm font-bold text-center">
                              {m.type === 'EXIT' ? (
                                <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                  ${profit.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-5 py-3 text-sm text-gray-600 text-center">{m.reason}</td>
                            <td className="px-5 py-3 text-sm text-gray-600 text-center">{m.responsible}</td>
                            <td className="px-5 py-3 text-sm text-gray-500 text-center">{new Date(m.createdAt).toLocaleDateString('es-CO')}</td>
                          </tr>
                        );
                      })}
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
