import { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Trash2,
  AlertTriangle, Package, Edit3, ImagePlus, X,
} from 'lucide-react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { productApi, categoryApi } from '../services/api';
import { Product, Category, UNIT_LABELS, UnitOfMeasure } from '../types';

const PIE_COLORS = ['#7c3aed', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'categories'>('all');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', categoryId: '', unitOfMeasure: 'UNIT' as UnitOfMeasure,
    currentStock: '0', minimumStock: '100', warehouseLocation: '', price: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [prodRes, catRes] = await Promise.all([productApi.getAll(), categoryApi.getAll()]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
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
    setFormData({ name: '', sku: '', description: '', categoryId: '', unitOfMeasure: 'UNIT', currentStock: '0', minimumStock: '100', warehouseLocation: '', price: '' });
    clearImage();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await productApi.create({
        ...formData,
        categoryId: Number(formData.categoryId),
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
        price: formData.price ? Number(formData.price) : undefined,
      }, imageFile || undefined);
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

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory ? p.categoryId === Number(filterCategory) : true;
    return matchSearch && matchCategory;
  });

  const categoryChartData = categories.map((c) => ({
    name: c.name,
    value: products.filter((p) => p.categoryId === c.id).length,
  })).filter((d) => d.value > 0);

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
                  onClick={() => setShowModal(true)}
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
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        No se encontraron productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Category Chart */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">Productos por Categoría</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {categoryChartData.map((_e, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {categoryChartData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Producto" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
              <input type="number" min="0" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input type="number" min="0" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
              <input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
          </div>

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
              Crear Producto
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
