import { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Trash2,
  AlertTriangle, Package, Edit3, ImagePlus, X,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { productApi, categoryApi, reportApi, inventoryApi, branchApi } from '../services/api';
import { Product, Category, UNIT_LABELS, UnitOfMeasure } from '../types';
import { useAuth } from '../context/AuthContext';

interface Branch { id: number; name: string; code: string; }

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  transactions: number;
}

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'categories'>('all');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDetail, setShowDetail] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [topSelling, setTopSelling] = useState<TopProduct[]>([]);
  const [addStock, setAddStock] = useState('');
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', categoryId: '', branchId: '', unitOfMeasure: 'UNIT' as UnitOfMeasure,
    currentStock: '0', minimumStock: '100', warehouseLocation: '', cost: '', price: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const params: Record<string, string> = {};
      if (filterBranch) params.branchId = filterBranch;
      const [prodRes, catRes, topRes, branchRes] = await Promise.all([
        productApi.getAll(params),
        categoryApi.getAll(),
        reportApi.getTopSelling(),
        branchApi.getAll(),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setTopSelling(topRes.data.products || []);
      setBranches(branchRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function resetForm() {
    setFormData({ name: '', sku: '', description: '', categoryId: '', branchId: filterBranch || '', unitOfMeasure: 'UNIT', currentStock: '0', minimumStock: '100', warehouseLocation: '', cost: '', price: '' });
    clearImage();
    setEditingProduct(null);
    setAddStock('');
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      categoryId: String(product.categoryId),
      branchId: product.branchId ? String(product.branchId) : '',
      unitOfMeasure: product.unitOfMeasure,
      currentStock: String(product.currentStock),
      minimumStock: String(product.minimumStock),
      warehouseLocation: product.warehouseLocation || '',
      cost: product.cost ? String(Number(product.cost)) : '',
      price: product.price ? String(Number(product.price)) : '',
    });
    setImagePreview(product.imageUrl || null);
    setImageFile(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, {
          name: formData.name,
          description: formData.description || undefined,
          categoryId: Number(formData.categoryId),
          unitOfMeasure: formData.unitOfMeasure,
          minimumStock: Number(formData.minimumStock),
          warehouseLocation: formData.warehouseLocation || undefined,
          cost: formData.cost ? Number(formData.cost) : undefined,
          price: formData.price ? Number(formData.price) : undefined,
        }, imageFile || undefined);

        // Si se agregó stock, registrar movimiento de entrada
        if (addStock && Number(addStock) > 0) {
          await inventoryApi.registerMovement({
            productId: editingProduct.id,
            type: 'ENTRY',
            quantity: Number(addStock),
            reason: 'Ingreso de mercancía (desde edición de producto)',
            responsible: 'Administrador',
          });
        }
      } else {
        await productApi.create({
          ...formData,
          categoryId: Number(formData.categoryId),
          branchId: formData.branchId ? Number(formData.branchId) : undefined,
          currentStock: Number(formData.currentStock),
          minimumStock: Number(formData.minimumStock),
          cost: formData.cost ? Number(formData.cost) : undefined,
          price: formData.price ? Number(formData.price) : undefined,
        }, imageFile || undefined);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Desactivar este producto?')) return;
    try {
      await productApi.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  // Reload when branch filter changes
  useEffect(() => { loadData(); }, [filterBranch]);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory ? p.categoryId === Number(filterCategory) : true;
    return matchSearch && matchCategory;
  });

  const topChartData = topSelling.map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    ventas: p.totalRevenue,
    cantidad: p.totalQuantity,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Header title="Productos" subtitle={`${products.length} productos registrados`} />

      <div className="flex gap-5">
        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs + Search + Add */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'categories' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Categorías
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto o SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 w-56"
                  />
                </div>

                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="px-3 py-2 bg-primary-50 rounded-xl border border-primary-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 text-primary-700 font-medium"
                >
                  <option value="">Todas las sedes</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200"
                >
                  <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sede</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((product) => (
                    <tr key={product.id} className="table-row-hover transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-primary-600 font-medium">{product.sku}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-primary-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">{product.name}</p>
                            {product.isLowStock && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500 font-semibold">
                                <AlertTriangle className="w-3 h-3" /> Stock Bajo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{product.category?.name}</td>
                      <td className="px-6 py-3.5 text-sm text-primary-600 font-medium">{product.branch?.name || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{product.warehouseLocation || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{UNIT_LABELS[product.unitOfMeasure]}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`text-sm font-bold ${product.isLowStock ? 'text-red-500' : 'text-gray-800'}`}>
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-right text-gray-700">
                        {product.price ? `$${Number(product.price).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-center relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenu === product.id && (
                          <div className="absolute right-6 top-12 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 min-w-[180px]">
                            <button
                              onClick={() => { setShowDetail(product); setOpenMenu(null); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                            >
                              <Eye className="w-4 h-4 text-blue-500" /> Ver detalles
                            </button>
                            <button
                              onClick={() => { openEdit(product); setOpenMenu(null); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                            >
                              <Edit3 className="w-4 h-4 text-amber-500" /> Editar producto
                            </button>
                            <button
                              onClick={() => { handleDelete(product.id); setOpenMenu(null); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar producto
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        No se encontraron productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Top 10 Selling */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-base font-bold text-gray-800 mb-1">Top 10 Más Vendidos</h3>
            <p className="text-xs text-gray-400 mb-4">Por valor total de ventas</p>

            {topSelling.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin ventas registradas</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                    <ReTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`$${value.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 'Ventas']}
                    />
                    <Bar dataKey="ventas" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto">
                  {topSelling.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i < 3 ? 'bg-primary-500' : 'bg-gray-400'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{item.sku} · {item.transactions} ventas · {item.totalQuantity} uds</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 flex-shrink-0">
                        ${item.totalRevenue.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                disabled={!!editingProduct}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>

          {/* Sede */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sede *</label>
            <select required value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full px-3 py-2.5 bg-primary-50 rounded-xl border border-primary-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none text-primary-700 font-medium">
              <option value="">Seleccionar sede...</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                <option value="">Seleccionar...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
              <select value={formData.unitOfMeasure} onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value as UnitOfMeasure })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                {Object.entries(UNIT_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>

          {/* Stock info cuando se edita */}
          {editingProduct && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Inventario</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Stock Actual</p>
                  <p className={`text-xl font-bold ${editingProduct.isLowStock ? 'text-red-500' : 'text-gray-800'}`}>{editingProduct.currentStock}</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Agregar Stock</p>
                  <input type="number" min="0" value={addStock} onChange={(e) => setAddStock(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-xl font-bold text-emerald-600 bg-transparent border-none focus:outline-none" />
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Nuevo Total</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {editingProduct.currentStock + (Number(addStock) || 0)}
                  </p>
                </div>
              </div>
              {addStock && Number(addStock) > 0 && (
                <p className="text-xs text-blue-600 font-medium">Se registrará una entrada de {addStock} unidades al guardar</p>
              )}
            </div>
          )}

          <div className={`grid gap-4 ${editingProduct ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {!editingProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                <input type="number" min="0" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input type="number" min="0" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
              <input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
          </div>

          {/* Costo y Margen - Solo Admin */}
          {isAdmin && (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Costos y Utilidad (solo admin)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Costo de adquisición</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input type="number" min="0" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio de venta</label>
                  <div className="px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">
                    {formData.price ? `$${Number(formData.price).toLocaleString('es-CO', { minimumFractionDigits: 2 })}` : '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Margen de utilidad</label>
                  {formData.cost && formData.price && Number(formData.cost) > 0 ? (
                    <div className="px-3 py-2.5 bg-white rounded-xl border border-gray-200">
                      <p className={`text-sm font-bold ${((Number(formData.price) - Number(formData.cost)) / Number(formData.cost) * 100) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {((Number(formData.price) - Number(formData.cost)) / Number(formData.cost) * 100).toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-gray-400">
                        ${(Number(formData.price) - Number(formData.cost)).toLocaleString('es-CO', { minimumFractionDigits: 2 })} / ud
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-400">—</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-xl border-2 border-primary-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50/30 transition cursor-pointer"
              >
                <ImagePlus className="w-8 h-8 text-gray-400 mb-1.5" />
                <span className="text-xs text-gray-500 font-medium">Subir imagen</span>
                <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en Bodega</label>
            <input placeholder="Ej: Pasillo A, Estante 3" value={formData.warehouseLocation} onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle del Producto">
        {showDetail && (
          <div className="space-y-3">
            {/* Product Image */}
            {showDetail.imageUrl ? (
              <div className="flex justify-center mb-2">
                <img src={showDetail.imageUrl} alt={showDetail.name} className="w-40 h-40 object-cover rounded-2xl border-2 border-gray-100 shadow-sm" />
              </div>
            ) : (
              <div className="flex justify-center mb-2">
                <div className="w-40 h-40 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                  <Package className="w-12 h-12 text-gray-300" />
                  <span className="text-xs text-gray-400 mt-1">Sin imagen</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">SKU</p><p className="text-sm font-bold font-mono">{showDetail.sku}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Categoría</p><p className="text-sm font-bold">{showDetail.category?.name}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Stock Actual</p><p className={`text-sm font-bold ${showDetail.isLowStock ? 'text-red-500' : ''}`}>{showDetail.currentStock}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Stock Mínimo</p><p className="text-sm font-bold">{showDetail.minimumStock}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Unidad</p><p className="text-sm font-bold">{UNIT_LABELS[showDetail.unitOfMeasure]}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Precio</p><p className="text-sm font-bold">{showDetail.price ? `$${Number(showDetail.price).toFixed(2)}` : 'N/A'}</p></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Ubicación</p><p className="text-sm font-bold">{showDetail.warehouseLocation || 'Sin asignar'}</p></div>
            {showDetail.isLowStock && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" /> Este producto tiene stock por debajo del mínimo
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
