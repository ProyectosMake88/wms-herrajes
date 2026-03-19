import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Tags, Package, AlertTriangle, ArrowLeft, Eye } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { categoryApi, productApi } from '../services/api';
import { Category, Product, UNIT_LABELS } from '../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Category detail view
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function openCategoryDetail(cat: Category) {
    setSelectedCategory(cat);
    setLoadingProducts(true);
    try {
      const res = await productApi.getAll({ categoryId: String(cat.id) });
      setCategoryProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  }

  function closeCategoryDetail() {
    setSelectedCategory(null);
    setCategoryProducts([]);
  }

  function openEdit(cat: Category, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setShowModal(true);
  }

  function openCreate() {
    setEditing(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await categoryApi.update(editing.id, formData);
      } else {
        await categoryApi.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta categoría? Los productos asociados deben reasignarse primero.')) return;
    try {
      await categoryApi.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  // Category Detail View
  if (selectedCategory) {
    const totalStock = categoryProducts.reduce((sum, p) => sum + p.currentStock, 0);
    const lowStockCount = categoryProducts.filter((p) => p.isLowStock).length;
    const totalValue = categoryProducts.reduce((sum, p) => sum + (Number(p.price || 0) * p.currentStock), 0);

    return (
      <div>
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={closeCategoryDetail} className="p-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{selectedCategory.description || 'Sin descripción'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Productos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{categoryProducts.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Stock Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalStock.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Valor Estimado</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">${totalValue.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Stock Bajo</p>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-gray-900'}`}>{lowStockCount}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Productos en "{selectedCategory.name}"</h3>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : categoryProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay productos en esta categoría</p>
              <p className="text-sm text-gray-400 mt-1">Agrega productos desde la sección de Productos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Imagen</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mínimo</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categoryProducts.map((product) => (
                    <tr key={product.id} className="table-row-hover transition-colors">
                      <td className="px-6 py-3.5">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-mono text-primary-600 font-medium">{product.sku}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-gray-500 max-w-[200px] truncate">{product.description || '—'}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{UNIT_LABELS[product.unitOfMeasure]}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{product.warehouseLocation || '—'}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`text-sm font-bold ${product.isLowStock ? 'text-red-500' : 'text-gray-800'}`}>
                          {product.currentStock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-right text-gray-500">{product.minimumStock}</td>
                      <td className="px-6 py-3.5 text-sm font-medium text-right text-gray-700">
                        {product.price ? `$${Number(product.price).toLocaleString('es-CO', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {product.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Bajo
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Categories Grid View
  return (
    <div>
      <Header title="Categorías" subtitle="Administra las categorías de herrajes" />

      <div className="flex justify-end mb-5">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
          <Plus className="w-4 h-4" /> Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => openCategoryDetail(cat)}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition">
                <Tags className="w-6 h-6 text-primary-500" />
              </div>
              <div className="flex gap-1">
                <button onClick={(e) => openEdit(cat, e)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={(e) => handleDelete(cat.id, e)} className="p-2 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800">{cat.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description || 'Sin descripción'}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">{cat.products?.length || 0} productos</span>
              </div>
              <span className="text-xs text-primary-500 font-medium group-hover:text-primary-600 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Ver detalle
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              {editing ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
