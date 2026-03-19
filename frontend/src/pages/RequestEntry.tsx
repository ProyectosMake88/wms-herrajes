import { useEffect, useState } from 'react';
import { ArrowDownToLine, Package, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { productApi, pendingEntryApi } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

interface PendingEntry {
  id: number;
  quantity: number;
  reason: string;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
  product: { id: number; name: string; sku: string };
}

export default function RequestEntry() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({ productId: '', quantity: '', reason: '', notes: '' });

  // Seller can't see all pending entries (admin only), so we just show a success message
  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await productApi.getAll();
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await pendingEntryApi.create({
        productId: Number(formData.productId),
        quantity: Number(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || undefined,
      });
      setShowModal(false);
      setFormData({ productId: '', quantity: '', reason: '', notes: '' });
      setSuccess('Solicitud enviada. El administrador revisará tu solicitud de entrada.');
      setTimeout(() => setSuccess(null), 6000);
    } catch (error: any) {
      alert(error.message);
    }
  }

  const selectedProduct = formData.productId ? products.find((p) => p.id === Number(formData.productId)) : null;

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Solicitar Entrada de Inventario" subtitle={`Bienvenido, ${user?.name}`} />

      {success && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 text-sm">Cerrar</button>
        </div>
      )}

      {/* Info card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <ArrowDownToLine className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Solicitar entrada de productos</h3>
            <p className="text-sm text-gray-500 mt-1">
              Las entradas de inventario requieren aprobación del administrador. Al enviar tu solicitud,
              el admin recibirá una notificación con los detalles del producto, cantidad y tu perfil.
            </p>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              <Plus className="w-4 h-4" /> Nueva Solicitud de Entrada
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">1. Envías solicitud</h4>
          <p className="text-xs text-gray-500 mt-1">Selecciona el producto y la cantidad que necesitas ingresar</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">2. Admin revisa</h4>
          <p className="text-xs text-gray-500 mt-1">El administrador recibe la notificación y revisa tu solicitud</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">3. Se actualiza el stock</h4>
          <p className="text-xs text-gray-500 mt-1">Si es aprobada, el inventario se actualiza automáticamente</p>
        </div>
      </div>

      {/* Request Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Solicitud de Entrada">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
            <select required value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
              <option value="">Seleccionar producto...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.currentStock}</option>)}
            </select>
          </div>

          {selectedProduct && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">Stock actual: <span className="font-bold">{selectedProduct.currentStock}</span></p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a ingresar *</label>
            <input required type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <input required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Recepción de proveedor, Devolución de cliente..."
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Información adicional..."
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              <ArrowDownToLine className="w-4 h-4" /> Enviar Solicitud
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
