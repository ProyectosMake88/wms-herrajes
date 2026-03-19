import { useEffect, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, Plus, Filter,
  AlertTriangle,
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { inventoryApi, productApi } from '../services/api';
import { Movement, Product } from '../types';

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productId: '', type: 'ENTRY' as 'ENTRY' | 'EXIT', quantity: '',
    salePrice: '', reason: '', responsible: '', notes: '',
  });

  // Pre-llenar precio al seleccionar producto cuando es salida
  function handleProductChange(productId: string) {
    const product = products.find((p) => p.id === Number(productId));
    const price = product?.price ? Number(product.price).toFixed(2) : '';
    setFormData((prev) => ({
      ...prev,
      productId,
      salePrice: prev.type === 'EXIT' ? price : prev.salePrice,
    }));
  }

  // Pre-llenar precio al cambiar a salida
  function handleTypeChange(type: 'ENTRY' | 'EXIT') {
    const product = products.find((p) => p.id === Number(formData.productId));
    const price = product?.price ? Number(product.price).toFixed(2) : '';
    setFormData((prev) => ({
      ...prev,
      type,
      salePrice: type === 'EXIT' ? price : '',
    }));
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [movRes, prodRes] = await Promise.all([
        inventoryApi.getMovements(),
        productApi.getAll(),
      ]);
      setMovements(movRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await inventoryApi.registerMovement({
        productId: Number(formData.productId),
        type: formData.type,
        quantity: Number(formData.quantity),
        salePrice: formData.type === 'EXIT' && formData.salePrice ? Number(formData.salePrice) : undefined,
        reason: formData.reason,
        responsible: formData.responsible,
        notes: formData.notes || undefined,
      });
      if (res.alert) setAlert(res.alert);
      setShowModal(false);
      setFormData({ productId: '', type: 'ENTRY', quantity: '', salePrice: '', reason: '', responsible: '', notes: '' });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  function calcValue(mov: Movement): string {
    // Usar saleTotal si existe (movimientos de venta con precio registrado)
    if (mov.saleTotal) {
      return `$${Number(mov.saleTotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
    }
    // Fallback: calcular con precio del producto
    const price = mov.product?.price ? Number(mov.product.price) : 0;
    if (!price) return '—';
    return `$${(price * mov.quantity).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
  }

  // Obtener precio sugerido del producto seleccionado
  const selectedProduct = formData.productId
    ? products.find((p) => p.id === Number(formData.productId))
    : null;

  const filtered = movements.filter((m) => {
    if (filterType && m.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Movimientos" subtitle="Registro de entradas y salidas de inventario" />

      {/* Alert */}
      {alert && (
        <div className="mb-5 flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700 font-medium">{alert}</p>
          </div>
          <button onClick={() => setAlert(null)} className="text-amber-500 hover:text-amber-700 text-sm font-medium">Cerrar</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          <button onClick={() => setFilterType('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filterType === '' ? 'bg-primary-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Todos
          </button>
          <button onClick={() => setFilterType('ENTRY')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${filterType === 'ENTRY' ? 'bg-emerald-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <ArrowDownToLine className="w-3.5 h-3.5" /> Entradas
          </button>
          <button onClick={() => setFilterType('EXIT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${filterType === 'EXIT' ? 'bg-red-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <ArrowUpFromLine className="w-3.5 h-3.5" /> Salidas
          </button>
        </div>

        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
          <Plus className="w-4 h-4" /> Registrar Movimiento
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((mov) => (
                <tr key={mov.id} className="table-row-hover transition-colors">
                  <td className="px-6 py-3.5 text-center">
                    {mov.type === 'ENTRY' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                        <ArrowDownToLine className="w-3 h-3" /> Entrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                        <ArrowUpFromLine className="w-3 h-3" /> Salida
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-800 text-center">{mov.product?.name}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-gray-500 text-center">{mov.product?.sku}</td>
                  <td className="px-6 py-3.5 text-sm font-bold text-gray-800 text-center">{mov.quantity}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-center">
                    <span className={mov.type === 'EXIT' ? 'text-red-600' : 'text-emerald-600'}>
                      {calcValue(mov)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600 text-center">{mov.reason}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-600 text-center">{mov.responsible}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-500 text-center">{new Date(mov.createdAt).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No hay movimientos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Movement Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Movimiento" maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
              <select required value={formData.productId} onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                <option value="">Seleccionar...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleTypeChange('ENTRY')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${formData.type === 'ENTRY' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  Entrada
                </button>
                <button type="button" onClick={() => handleTypeChange('EXIT')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${formData.type === 'EXIT' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  Salida
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input required type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable *</label>
              <input required value={formData.responsible} onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
          </div>

          {/* Valor de venta — solo visible cuando es SALIDA */}
          {formData.type === 'EXIT' && (
            <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-3">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Datos de la venta</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario de venta *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder={selectedProduct?.price ? Number(selectedProduct.price).toFixed(2) : '0.00'}
                      className="w-full pl-7 pr-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                    />
                  </div>
                  {selectedProduct?.price && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, salePrice: Number(selectedProduct.price).toFixed(2) })}
                      className="text-[11px] text-primary-600 hover:text-primary-700 font-medium mt-1"
                    >
                      Usar precio base: ${Number(selectedProduct.price).toFixed(2)}
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total de la venta</label>
                  <div className="px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-bold text-red-600">
                    {formData.salePrice && formData.quantity
                      ? `$${(Number(formData.salePrice) * Number(formData.quantity)).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
                      : '$0.00'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <input required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Compra a proveedor, Venta a cliente..."
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
