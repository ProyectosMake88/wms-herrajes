import { useEffect, useState } from 'react';
import { ShoppingBag, Search, ArrowUpFromLine, AlertTriangle, Package } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { productApi, inventoryApi } from '../services/api';
import { Product, UNIT_LABELS } from '../types';
import { useAuth } from '../context/AuthContext';

export default function SellerSales() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Venta');
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await productApi.getAll();
      setProducts(res.data.filter((p: Product) => p.isActive && p.currentStock > 0));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openSale(product: Product) {
    setSelectedProduct(product);
    setQuantity('');
    setReason('Venta');
    setNotes('');
    setShowModal(true);
  }

  async function handleSale(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await inventoryApi.registerMovement({
        productId: selectedProduct.id,
        type: 'EXIT',
        quantity: Number(quantity),
        reason,
        responsible: user?.name || 'Vendedor',
        notes: notes || undefined,
      });
      setShowModal(false);
      setSuccess(`Venta registrada: ${quantity}x ${selectedProduct.name}`);
      if (res.alert) setAlert(res.alert);
      setTimeout(() => setSuccess(null), 4000);
      loadProducts();
    } catch (error: any) {
      alert(error.message);
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Registrar Venta" subtitle={`Bienvenido, ${user?.name}`} />

      {/* Success Alert */}
      {success && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 text-sm">Cerrar</button>
        </div>
      )}

      {/* Low Stock Alert */}
      {alert && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700 font-medium">{alert}</p>
          </div>
          <button onClick={() => setAlert(null)} className="text-amber-500 text-sm">Cerrar</button>
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            {/* Image */}
            <div className="w-full h-32 bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Package className="w-10 h-10 text-gray-300" />
              )}
            </div>

            <p className="text-xs font-mono text-primary-600 font-medium">{product.sku}</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5 line-clamp-1">{product.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{product.category?.name} - {UNIT_LABELS[product.unitOfMeasure]}</p>

            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-xs text-gray-400">Disponible</p>
                <p className={`text-lg font-bold ${product.isLowStock ? 'text-amber-500' : 'text-gray-800'}`}>
                  {product.currentStock}
                </p>
              </div>
              <button
                onClick={() => openSale(product)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Vender
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">No hay productos disponibles</div>
        )}
      </div>

      {/* Sale Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Venta">
        {selectedProduct && (
          <form onSubmit={handleSale} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">{selectedProduct.sku} - Stock: {selectedProduct.currentStock}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a vender *</label>
              <input required type="number" min="1" max={selectedProduct.currentStock}
                value={quantity} onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Máximo: ${selectedProduct.currentStock}`}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                <option>Venta</option>
                <option>Venta mayorista</option>
                <option>Venta mostrador</option>
                <option>Pedido especial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Cliente, número de factura, etc."
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
                <ArrowUpFromLine className="w-4 h-4" /> Confirmar Venta
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
