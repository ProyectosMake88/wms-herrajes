import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MovementsReport, UNIT_LABELS } from '../types';

const PURPLE = { argb: 'FF5B21B6' };
const PURPLE_LIGHT = { argb: 'FFF5F3FF' };
const WHITE = { argb: 'FFFFFFFF' };
const GREEN = { argb: 'FF059669' };
const RED = { argb: 'FFDC2626' };
const BLUE = { argb: 'FF2563EB' };
const AMBER = { argb: 'FFD97706' };
const GRAY_BG = { argb: 'FFF9FAFB' };
const GRAY_BORDER = { argb: 'FFE5E7EB' };
const DARK = { argb: 'FF1F2937' };

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: GRAY_BORDER },
  bottom: { style: 'thin', color: GRAY_BORDER },
  left: { style: 'thin', color: GRAY_BORDER },
  right: { style: 'thin', color: GRAY_BORDER },
};

function fmt(n: number) {
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

function addCard(ws: ExcelJS.Worksheet, row: number, col: number, label: string, value: string, color: Partial<ExcelJS.Color>) {
  // Label cell
  const labelCell = ws.getCell(row, col);
  labelCell.value = label;
  labelCell.font = { size: 9, color: { argb: 'FF6B7280' } };
  labelCell.alignment = { horizontal: 'center' };
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: WHITE };
  labelCell.border = { top: { style: 'thin', color: GRAY_BORDER }, left: { style: 'thin', color: GRAY_BORDER }, right: { style: 'thin', color: GRAY_BORDER } };

  // Value cell
  const valCell = ws.getCell(row + 1, col);
  valCell.value = value;
  valCell.font = { size: 16, bold: true, color };
  valCell.alignment = { horizontal: 'center', vertical: 'middle' };
  valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: WHITE };
  valCell.border = { bottom: { style: 'thin', color: GRAY_BORDER }, left: { style: 'thin', color: GRAY_BORDER }, right: { style: 'thin', color: GRAY_BORDER } };
}

export async function exportMovementsReport(report: MovementsReport, companyName?: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AdVenty';
  wb.created = new Date();

  const s = report.summary;
  const movements = report.movements;

  // ==========================================
  // SHEET 1: Resumen Ejecutivo
  // ==========================================
  const ws1 = wb.addWorksheet('Resumen', {
    properties: { defaultColWidth: 18 },
    views: [{ showGridLines: false }],
  });

  // Column widths
  ws1.columns = [
    { width: 3 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 3 },
  ];

  // HEADER BAR (rows 1-3)
  for (let c = 1; c <= 8; c++) {
    for (let r = 1; r <= 3; r++) {
      const cell = ws1.getCell(r, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: PURPLE };
    }
  }
  ws1.mergeCells('B1:G1');
  const titleCell = ws1.getCell('B1');
  titleCell.value = 'REPORTE DE VENTAS';
  titleCell.font = { size: 20, bold: true, color: WHITE };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells('B2:G2');
  const subtitleCell = ws1.getCell('B2');
  subtitleCell.value = `${companyName || 'AdVenty'} — Sistema de Gestión de Inventarios`;
  subtitleCell.font = { size: 11, color: { argb: 'FFD4C9FF' } };
  subtitleCell.alignment = { horizontal: 'center' };

  ws1.mergeCells('B3:G3');
  const dateCell = ws1.getCell('B3');
  dateCell.value = `Período: ${new Date(s.dateRange.from).toLocaleDateString('es-CO')} al ${new Date(s.dateRange.to).toLocaleDateString('es-CO')}  |  Generado: ${new Date().toLocaleDateString('es-CO')}`;
  dateCell.font = { size: 10, color: { argb: 'FFB5A0FF' } };
  dateCell.alignment = { horizontal: 'center' };

  ws1.getRow(1).height = 32;
  ws1.getRow(2).height = 20;
  ws1.getRow(3).height = 20;

  // Row 4: spacer
  ws1.getRow(4).height = 10;

  // SECTION: Resumen de Movimientos (Row 5-6)
  ws1.mergeCells('B5:G5');
  const secTitle1 = ws1.getCell('B5');
  secTitle1.value = 'RESUMEN DE VENTAS';
  secTitle1.font = { size: 11, bold: true, color: PURPLE };
  secTitle1.border = { bottom: { style: 'medium', color: PURPLE } };

  // Cards row 1 (Row 7-8)
  addCard(ws1, 7, 2, 'Total Registros', String(s.totalMovements), PURPLE);
  addCard(ws1, 7, 3, 'Entradas', `${s.totalEntries} (${s.totalEntryQuantity} uds)`, GREEN);
  addCard(ws1, 7, 4, 'Salidas', `${s.totalExits} (${s.totalExitQuantity} uds)`, RED);
  addCard(ws1, 7, 5, 'Balance Neto', `${s.totalEntryQuantity - s.totalExitQuantity} uds`, BLUE);

  // Row 9: spacer
  ws1.getRow(9).height = 8;

  // SECTION: Análisis Financiero (Row 10)
  ws1.mergeCells('B10:G10');
  const secTitle2 = ws1.getCell('B10');
  secTitle2.value = 'ANÁLISIS FINANCIERO';
  secTitle2.font = { size: 11, bold: true, color: PURPLE };
  secTitle2.border = { bottom: { style: 'medium', color: PURPLE } };

  // Financial cards (Row 12-13)
  addCard(ws1, 12, 2, 'Ingresos por Ventas', fmt(s.totalSaleRevenue), BLUE);
  addCard(ws1, 12, 3, 'Costo de Adquisición', fmt(s.totalCostOfSales), AMBER);
  addCard(ws1, 12, 4, 'Utilidad Neta', fmt(s.totalProfit), s.totalProfit >= 0 ? GREEN : RED);
  addCard(ws1, 12, 5, 'Margen de Ganancia', `${s.profitMargin.toFixed(1)}%`, s.profitMargin >= 0 ? GREEN : RED);

  // Row 14: spacer
  ws1.getRow(14).height = 8;

  // SECTION: Resumen por Vendedor (Row 15+)
  ws1.mergeCells('B15:G15');
  const secTitle3 = ws1.getCell('B15');
  secTitle3.value = 'RESUMEN POR VENDEDOR';
  secTitle3.font = { size: 11, bold: true, color: PURPLE };
  secTitle3.border = { bottom: { style: 'medium', color: PURPLE } };

  // Aggregate by responsible
  const byResp = new Map<string, { sales: number; revenue: number; cost: number; profit: number }>();
  movements.filter((m: any) => m.type === 'EXIT').forEach((m: any) => {
    const ex = byResp.get(m.responsible) || { sales: 0, revenue: 0, cost: 0, profit: 0 };
    const saleTotal = m.saleTotal ? Number(m.saleTotal) : 0;
    const costTotal = m.product?.cost ? Number(m.product.cost) * m.quantity : 0;
    ex.sales += m.quantity; ex.revenue += saleTotal; ex.cost += costTotal; ex.profit += saleTotal - costTotal;
    byResp.set(m.responsible, ex);
  });

  // Seller header row
  const sellerHeaders = ['Responsable', 'Uds. Vendidas', 'Ingresos', 'Costo', 'Utilidad', 'Margen'];
  const sellerHeaderRow = ws1.getRow(17);
  sellerHeaders.forEach((h, i) => {
    const cell = sellerHeaderRow.getCell(i + 2);
    cell.value = h;
    cell.font = { size: 10, bold: true, color: WHITE };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  sellerHeaderRow.height = 26;

  let sellerRow = 18;
  const sortedResp = Array.from(byResp.entries()).sort((a, b) => b[1].revenue - a[1].revenue);
  sortedResp.forEach(([name, d], idx) => {
    const row = ws1.getRow(sellerRow);
    const isEven = idx % 2 === 0;
    const bgColor = isEven ? PURPLE_LIGHT : WHITE;
    const margin = d.revenue > 0 ? (d.profit / d.revenue * 100) : 0;

    const values = [name, d.sales, fmt(d.revenue), fmt(d.cost), fmt(d.profit), `${margin.toFixed(1)}%`];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 2);
      cell.value = v;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: bgColor };
      cell.border = thinBorder;
      cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
      if (i === 0) cell.font = { bold: true, size: 10, color: DARK };
      else if (i === 2) cell.font = { bold: true, size: 10, color: BLUE };
      else if (i === 3) cell.font = { bold: true, size: 10, color: AMBER };
      else if (i === 4) cell.font = { bold: true, size: 10, color: d.profit >= 0 ? GREEN : RED };
      else if (i === 5) cell.font = { bold: true, size: 10, color: margin >= 0 ? GREEN : RED };
      else cell.font = { size: 10, color: DARK };
    });
    row.height = 22;
    sellerRow++;
  });

  // Totals row
  if (sortedResp.length > 0) {
    const totalRow = ws1.getRow(sellerRow);
    const totals = ['TOTAL', s.totalExitQuantity, fmt(s.totalSaleRevenue), fmt(s.totalCostOfSales), fmt(s.totalProfit), `${s.profitMargin.toFixed(1)}%`];
    totals.forEach((v, i) => {
      const cell = totalRow.getCell(i + 2);
      cell.value = v;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      cell.font = { bold: true, size: 10, color: WHITE };
      cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });
    totalRow.height = 26;
  }

  // ==========================================
  // SHEET 2: Detalle de Movimientos
  // ==========================================
  const ws2 = wb.addWorksheet('Detalle Ventas - Registro Inv.', {
    views: [{ showGridLines: false }],
  });

  ws2.columns = [
    { width: 3 }, { width: 12 }, { width: 26 }, { width: 18 }, { width: 14 }, { width: 15 }, { width: 10 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 3 },
  ];

  // Header bar
  for (let c = 1; c <= 14; c++) {
    for (let r = 1; r <= 2; r++) {
      ws2.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: PURPLE };
    }
  }
  ws2.mergeCells('B1:M1');
  const t2 = ws2.getCell('B1');
  t2.value = 'DETALLE VENTAS / REGISTRO INVENTARIO';
  t2.font = { size: 16, bold: true, color: WHITE };
  t2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getRow(1).height = 30;

  ws2.mergeCells('B2:M2');
  const t2sub = ws2.getCell('B2');
  t2sub.value = `${new Date(s.dateRange.from).toLocaleDateString('es-CO')} — ${new Date(s.dateRange.to).toLocaleDateString('es-CO')}`;
  t2sub.font = { size: 10, color: { argb: 'FFD4C9FF' } };
  t2sub.alignment = { horizontal: 'center' };
  ws2.getRow(2).height = 22;

  // Table headers (Row 4)
  const headers = ['Tipo', 'Producto', 'Categoría', 'Unidad', 'SKU', 'Cant.', 'Venta Total', 'Costo Total', 'Utilidad', 'Motivo', 'Responsable', 'Fecha'];
  const headerRow = ws2.getRow(4);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 2);
    cell.value = h;
    cell.font = { size: 10, bold: true, color: WHITE };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: PURPLE };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  headerRow.height = 28;

  // Data rows
  movements.forEach((m: any, idx: number) => {
    const rowNum = idx + 5;
    const row = ws2.getRow(rowNum);
    const isEven = idx % 2 === 0;
    const bg = isEven ? PURPLE_LIGHT : WHITE;

    const saleTotal = m.saleTotal ? Number(m.saleTotal) : 0;
    const costTotal = m.product?.cost ? Number(m.product.cost) * m.quantity : 0;
    const profit = m.type === 'EXIT' ? saleTotal - costTotal : 0;

    const unitLabel = m.product?.unitOfMeasure ? (UNIT_LABELS[m.product.unitOfMeasure as keyof typeof UNIT_LABELS] || m.product.unitOfMeasure) : '—';
    const values = [
      m.type === 'ENTRY' ? '▲ Entrada' : '▼ Salida',
      m.product?.name || '',
      m.product?.category?.name || '—',
      unitLabel,
      m.product?.sku || '',
      m.quantity,
      m.type === 'EXIT' && saleTotal ? fmt(saleTotal) : '—',
      m.type === 'EXIT' && costTotal ? fmt(costTotal) : '—',
      m.type === 'EXIT' ? fmt(profit) : '—',
      m.reason,
      m.responsible,
      new Date(m.createdAt).toLocaleDateString('es-CO'),
    ];

    values.forEach((v, i) => {
      const cell = row.getCell(i + 2);
      cell.value = v;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: bg };
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Styling per column
      if (i === 0) {
        cell.font = { bold: true, size: 10, color: m.type === 'ENTRY' ? GREEN : RED };
      } else if (i === 1) {
        cell.font = { bold: true, size: 10, color: DARK };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (i === 2) {
        cell.font = { size: 10, color: { argb: 'FF7C3AED' } }; // Category in purple
      } else if (i === 3) {
        cell.font = { size: 10, color: { argb: 'FF4B5563' } }; // Unit
      } else if (i === 4) {
        cell.font = { size: 9, color: PURPLE }; // SKU
      } else if (i === 5) {
        cell.font = { bold: true, size: 11, color: DARK }; // Quantity
      } else if (i === 6) {
        cell.font = { bold: true, size: 10, color: BLUE }; // Sale total
      } else if (i === 7) {
        cell.font = { bold: true, size: 10, color: AMBER }; // Cost total
      } else if (i === 8) {
        cell.font = { bold: true, size: 10, color: m.type === 'EXIT' ? (profit >= 0 ? GREEN : RED) : { argb: 'FF9CA3AF' } }; // Profit
      } else {
        cell.font = { size: 10, color: { argb: 'FF4B5563' } };
      }
    });
    row.height = 22;
  });

  // Totals row at bottom
  const totalRowNum = movements.length + 5;
  const tRow = ws2.getRow(totalRowNum);
  const totalSale = movements.filter((m: any) => m.type === 'EXIT').reduce((sum: number, m: any) => sum + (m.saleTotal ? Number(m.saleTotal) : 0), 0);
  const totalCost = movements.filter((m: any) => m.type === 'EXIT').reduce((sum: number, m: any) => sum + (m.product?.cost ? Number(m.product.cost) * m.quantity : 0), 0);
  const totalQty = movements.reduce((sum: number, m: any) => sum + m.quantity, 0);

  const totalValues = ['', 'TOTALES', '', '', '', totalQty, fmt(totalSale), fmt(totalCost), fmt(totalSale - totalCost), '', '', ''];
  totalValues.forEach((v, i) => {
    const cell = tRow.getCell(i + 2);
    cell.value = v;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    cell.font = { bold: true, size: 10, color: WHITE };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });
  tRow.height = 28;

  // Footer
  const footerRow = ws2.getRow(totalRowNum + 2);
  ws2.mergeCells(totalRowNum + 2, 2, totalRowNum + 2, 13);
  const footerCell = footerRow.getCell(2);
  footerCell.value = `AdVenty — Reporte generado el ${new Date().toLocaleString('es-CO')}`;
  footerCell.font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
  footerCell.alignment = { horizontal: 'center' };

  // ==========================================
  // Generate and download
  // ==========================================
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
}
