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

function fmt(n: number) { return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2 }); }

function buildBarChartSVG(data: { label: string; value: number; color: string }[], width = 600, height = 200) {
  if (!data.length) return '';
  const max = Math.max(...data.map(d => d.value)) || 1;
  const barW = Math.min(50, (width - 80) / data.length - 10);
  const chartH = height - 50;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="font-family:Calibri,sans-serif;">`;
  svg += `<rect width="${width}" height="${height}" fill="white" rx="12"/>`;
  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = 20 + (chartH / 4) * i;
    svg += `<line x1="60" y1="${y}" x2="${width - 20}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>`;
    svg += `<text x="55" y="${y + 4}" fill="#9ca3af" font-size="9" text-anchor="end">${fmt(max - (max / 4) * i)}</text>`;
  }
  // Bars
  data.forEach((d, i) => {
    const barH = (d.value / max) * chartH;
    const x = 70 + i * ((width - 90) / data.length);
    const y = 20 + chartH - barH;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${d.color}" rx="4"/>`;
    svg += `<text x="${x + barW / 2}" y="${20 + chartH + 14}" fill="#6b7280" font-size="8" text-anchor="middle">${d.label.substring(0, 10)}</text>`;
  });
  svg += '</svg>';
  return svg;
}

function buildPieChartSVG(data: { label: string; value: number; color: string }[], size = 200) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size * 0.35, ir = size * 0.2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 160}" height="${size}" style="font-family:Calibri,sans-serif;">`;
  svg += `<rect width="${size + 160}" height="${size}" fill="white" rx="12"/>`;
  let angle = -Math.PI / 2;
  data.forEach((d, i) => {
    const a = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + a), y2 = cy + r * Math.sin(angle + a);
    const ix1 = cx + ir * Math.cos(angle), iy1 = cy + ir * Math.sin(angle);
    const ix2 = cx + ir * Math.cos(angle + a), iy2 = cy + ir * Math.sin(angle + a);
    const large = a > Math.PI ? 1 : 0;
    svg += `<path d="M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${large} 0 ${ix1},${iy1}" fill="${d.color}"/>`;
    // Legend
    const ly = 20 + i * 22;
    svg += `<rect x="${size + 10}" y="${ly}" width="10" height="10" rx="2" fill="${d.color}"/>`;
    svg += `<text x="${size + 26}" y="${ly + 9}" fill="#374151" font-size="10">${d.label.substring(0, 15)} (${d.value})</text>`;
    angle += a;
  });
  svg += '</svg>';
  return svg;
}

function exportToXlsx(report: MovementsReport) {
  const s = report.summary;
  const movements = report.movements;

  const rows = movements.map((m: any) => {
    const saleTotal = m.saleTotal ? Number(m.saleTotal) : 0;
    const costTotal = m.product?.cost ? Number(m.product.cost) * m.quantity : 0;
    const profit = m.type === 'EXIT' ? saleTotal - costTotal : 0;
    return { type: m.type, product: m.product?.name || '', sku: m.product?.sku || '', quantity: m.quantity, saleTotal, costTotal, profit, reason: m.reason, responsible: m.responsible, date: new Date(m.createdAt).toLocaleDateString('es-CO') };
  });

  // Aggregate by responsible
  const byResponsible = new Map<string, { sales: number; revenue: number; cost: number; profit: number }>();
  rows.filter(r => r.type === 'EXIT').forEach(r => {
    const ex = byResponsible.get(r.responsible) || { sales: 0, revenue: 0, cost: 0, profit: 0 };
    ex.sales += r.quantity; ex.revenue += r.saleTotal; ex.cost += r.costTotal; ex.profit += r.profit;
    byResponsible.set(r.responsible, ex);
  });

  // Aggregate by product
  const byProduct = new Map<string, { quantity: number; revenue: number }>();
  rows.filter(r => r.type === 'EXIT').forEach(r => {
    const ex = byProduct.get(r.product) || { quantity: 0, revenue: 0 };
    ex.quantity += r.quantity; ex.revenue += r.saleTotal;
    byProduct.set(r.product, ex);
  });

  const colors = ['#7c3aed', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  // Revenue bar chart by responsible
  const respData = Array.from(byResponsible.entries()).sort((a, b) => b[1].revenue - a[1].revenue).map((e, i) => ({ label: e[0], value: e[1].revenue, color: colors[i % colors.length] }));
  const revenueChart = buildBarChartSVG(respData, 580, 180);

  // Pie chart by product
  const prodData = Array.from(byProduct.entries()).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8).map((e, i) => ({ label: e[0], value: e[1].revenue, color: colors[i % colors.length] }));
  const pieChart = buildPieChartSVG(prodData, 180);

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"><style>
  body { font-family: Calibri, sans-serif; margin: 0; padding: 20px; background: #f8f7fc; }
  .header { background: linear-gradient(135deg, #5b21b6, #7c3aed); color: white; padding: 24px 30px; border-radius: 16px; margin-bottom: 20px; }
  .header h1 { margin: 0; font-size: 22px; } .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.8; }
  .cards { display: flex; gap: 12px; margin-bottom: 20px; }
  .card { flex: 1; background: white; border-radius: 14px; padding: 16px 20px; border: 1px solid #e5e7eb; }
  .card-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
  .card-value { font-size: 22px; font-weight: bold; }
  .card-sub { font-size: 10px; margin-top: 2px; }
  .purple { color: #7c3aed; } .green { color: #059669; } .red { color: #dc2626; } .blue { color: #2563eb; } .amber { color: #d97706; }
  .section { background: white; border-radius: 14px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 16px; }
  .section h3 { margin: 0 0 14px; font-size: 14px; color: #1f2937; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th { background: #5b21b6; color: white; padding: 10px 12px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: center; }
  tr:nth-child(even) { background: #f5f3ff; }
  .badge-entry { background: #d1fae5; color: #059669; padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; }
  .badge-exit { background: #fee2e2; color: #dc2626; padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; }
  .chart-row { display: flex; gap: 16px; margin-bottom: 16px; }
  .chart-box { flex: 1; background: white; border-radius: 14px; padding: 16px; border: 1px solid #e5e7eb; }
  .chart-box h4 { margin: 0 0 10px; font-size: 13px; color: #1f2937; }
  .resp-table th { background: #3b82f6; }
  .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 20px; padding: 10px; }
</style></head><body>`;

  // Header
  html += `<div class="header"><h1>Reporte de Movimientos</h1><p>WMS Herrajes - Sistema de Inventarios &nbsp;|&nbsp; Período: ${new Date(s.dateRange.from).toLocaleDateString('es-CO')} al ${new Date(s.dateRange.to).toLocaleDateString('es-CO')} &nbsp;|&nbsp; Generado: ${new Date().toLocaleDateString('es-CO')}</p></div>`;

  // Summary Cards Row 1
  html += `<div class="cards">
    <div class="card"><div class="card-label">Total Movimientos</div><div class="card-value purple">${s.totalMovements}</div></div>
    <div class="card"><div class="card-label">Entradas</div><div class="card-value green">${s.totalEntries}</div><div class="card-sub green">${s.totalEntryQuantity} unidades</div></div>
    <div class="card"><div class="card-label">Salidas</div><div class="card-value red">${s.totalExits}</div><div class="card-sub red">${s.totalExitQuantity} unidades</div></div>
    <div class="card"><div class="card-label">Balance Neto</div><div class="card-value blue">${s.totalEntryQuantity - s.totalExitQuantity}</div></div>
  </div>`;

  // Financial Cards Row 2
  html += `<div class="cards">
    <div class="card"><div class="card-label">Ingresos por Ventas</div><div class="card-value blue">${fmt(s.totalSaleRevenue)}</div></div>
    <div class="card"><div class="card-label">Costo de Adquisición</div><div class="card-value amber">${fmt(s.totalCostOfSales)}</div></div>
    <div class="card"><div class="card-label">Utilidad Neta</div><div class="card-value ${s.totalProfit >= 0 ? 'green' : 'red'}">${fmt(s.totalProfit)}</div></div>
    <div class="card"><div class="card-label">Margen de Ganancia</div><div class="card-value ${s.profitMargin >= 0 ? 'green' : 'red'}">${s.profitMargin.toFixed(1)}%</div></div>
  </div>`;

  // Charts
  html += `<div class="chart-row">`;
  html += `<div class="chart-box"><h4>Ventas por Responsable</h4>${revenueChart}</div>`;
  html += `<div class="chart-box"><h4>Ventas por Producto</h4>${pieChart}</div>`;
  html += `</div>`;

  // Responsible breakdown table
  if (byResponsible.size > 0) {
    html += `<div class="section"><h3>Resumen por Vendedor</h3><table class="resp-table"><thead><tr>
      <th>Responsable</th><th>Uds. Vendidas</th><th>Ingresos</th><th>Costo</th><th>Utilidad</th><th>Margen</th>
    </tr></thead><tbody>`;
    Array.from(byResponsible.entries()).sort((a, b) => b[1].revenue - a[1].revenue).forEach(([name, d]) => {
      const margin = d.revenue > 0 ? (d.profit / d.revenue * 100).toFixed(1) : '0.0';
      html += `<tr><td style="font-weight:bold;text-align:left">${name}</td><td>${d.sales}</td><td class="blue">${fmt(d.revenue)}</td><td class="amber">${fmt(d.cost)}</td><td class="${d.profit >= 0 ? 'green' : 'red'}">${fmt(d.profit)}</td><td class="${d.profit >= 0 ? 'green' : 'red'}">${margin}%</td></tr>`;
    });
    html += `</tbody></table></div>`;
  }

  // Full movements table
  html += `<div class="section"><h3>Detalle de Movimientos</h3><table><thead><tr>
    <th>Tipo</th><th>Producto</th><th>SKU</th><th>Cant.</th><th>Venta Total</th><th>Costo Total</th><th>Utilidad</th><th>Motivo</th><th>Responsable</th><th>Fecha</th>
  </tr></thead><tbody>`;
  rows.forEach(r => {
    const badge = r.type === 'ENTRY' ? '<span class="badge-entry">Entrada</span>' : '<span class="badge-exit">Salida</span>';
    html += `<tr>
      <td>${badge}</td><td style="font-weight:600">${r.product}</td><td style="font-family:monospace;color:#7c3aed">${r.sku}</td><td style="font-weight:bold">${r.quantity}</td>
      <td class="blue">${r.type === 'EXIT' && r.saleTotal ? fmt(r.saleTotal) : '—'}</td>
      <td class="amber">${r.type === 'EXIT' && r.costTotal ? fmt(r.costTotal) : '—'}</td>
      <td class="${r.profit >= 0 ? 'green' : 'red'}">${r.type === 'EXIT' ? fmt(r.profit) : '—'}</td>
      <td>${r.reason}</td><td>${r.responsible}</td><td>${r.date}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;

  html += `<div class="footer">WMS Herrajes - Sistema de Gestión de Inventarios &nbsp;|&nbsp; Reporte generado automáticamente</div>`;
  html += '</body></html>';

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
