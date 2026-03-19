import { useEffect, useState } from 'react';
import {
  Plus, Edit3, Trash2, MapPin, Users, Package, Eye, Phone, Building2,
  ArrowLeft, AlertTriangle, MoreHorizontal,
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { branchApi, productApi, categoryApi, inventoryApi, branchStockApi } from '../services/api';
import { Product, Category, UNIT_LABELS, UnitOfMeasure } from '../types';

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  manager: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { users: number; products: number; movements: number };
  users?: { id: number; name: string; email: string; role: string; isActive: boolean }[];
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '', city: '', phone: '', manager: '' });

  // Detail view
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchProducts, setBranchProducts] = useState<Product[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit product in branch
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', categoryId: '', unitOfMeasure: 'UNIT' as UnitOfMeasure, minimumStock: '', warehouseLocation: '', cost: '', price: '' });
  const [addStockAmount, setAddStockAmount] = useState('');
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  // Assign product to branch
  const [showAssignProduct, setShowAssignProduct] = useState(false);
  const [orgProducts, setOrgProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [assignQuantity, setAssignQuantity] = useState('');
  const [assignSearch, setAssignSearch] = useState('');

  // Create new product in branch
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductForm, setAddProductForm] = useState({ name: '', sku: '', description: '', categoryId: '', unitOfMeasure: 'UNIT' as UnitOfMeasure, currentStock: '0', minimumStock: '100', warehouseLocation: '', cost: '', price: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [brRes, catRes] = await Promise.all([branchApi.getAll(), categoryApi.getAll()]);
      setBranches(brRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function openBranchDetail(branch: Branch) {
    setSelectedBranch(branch);
    setLoadingDetail(true);
    try {
      const [brDetail, stockRes, prodRes] = await Promise.all([
        branchApi.getById(branch.id),
        branchStockApi.getByBranch(branch.id),
        productApi.getAll({ branchId: String(branch.id) }),
      ]);
      setSelectedBranch(brDetail.data);
      // Combine: products assigned via BranchStock + products directly in branch
      const stockProducts = (stockRes.data || []).map((bs: any) => ({
        ...bs.product,
        currentStock: bs.quantity, // Override with branch-specific stock
        _branchStockId: bs.id,
      }));
      // Also keep direct branch products that aren't in branchStocks
      const stockProductIds = stockProducts.map((p: any) => p.id);
      const directProducts = (prodRes.data || []).filter((p: any) => !stockProductIds.includes(p.id));
      setBranchProducts([...stockProducts, ...directProducts]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeBranchDetail() {
    setSelectedBranch(null);
    setBranchProducts([]);
  }

  function openCreate() {
    setEditing(null);
    setFormData({ name: '', code: '', address: '', city: '', phone: '', manager: '' });
    setShowModal(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setFormData({ name: branch.name, code: branch.code, address: branch.address || '', city: branch.city || '', phone: branch.phone || '', manager: branch.manager || '' });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) await branchApi.update(editing.id, formData);
      else await branchApi.create(formData);
      setShowModal(false);
      loadData();
      if (selectedBranch) openBranchDetail(selectedBranch);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Desactivar esta sede?')) return;
    try {
      await branchApi.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  // Product editing within branch
  function openProductEdit(product: Product) {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      categoryId: String(product.categoryId),
      unitOfMeasure: product.unitOfMeasure,
      minimumStock: String(product.minimumStock),
      warehouseLocation: product.warehouseLocation || '',
      cost: product.cost ? String(Number(product.cost)) : '',
      price: product.price ? String(Number(product.price)) : '',
    });
    setAddStockAmount('');
    setShowEditProduct(true);
    setOpenMenu(null);
  }

  async function handleProductUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editProduct) return;
    try {
      await productApi.update(editProduct.id, {
        name: editForm.name,
        categoryId: Number(editForm.categoryId),
        unitOfMeasure: editForm.unitOfMeasure,
        minimumStock: Number(editForm.minimumStock),
        warehouseLocation: editForm.warehouseLocation || undefined,
        cost: editForm.cost ? Number(editForm.cost) : undefined,
        price: editForm.price ? Number(editForm.price) : undefined,
      });
      // Add stock if specified
      if (addStockAmount && Number(addStockAmount) > 0) {
        await inventoryApi.registerMovement({
          productId: editProduct.id,
          type: 'ENTRY',
          quantity: Number(addStockAmount),
          reason: 'Ingreso de mercancía (desde gestión de sede)',
          responsible: 'Administrador',
        });
      }
      setShowEditProduct(false);
      if (selectedBranch) openBranchDetail(selectedBranch);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function openAssignProduct() {
    try {
      const res = await branchStockApi.getAvailable();
      // Only products with available stock > 0
      const available = (res.data || []).filter((p: any) => p.availableStock > 0);
      setOrgProducts(available);
      setSelectedProductId('');
      setAssignQuantity('');
      setAssignSearch('');
      setShowAssignProduct(true);
    } catch (error) { console.error(error); }
  }

  async function handleAssignProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBranch || !selectedProductId || !assignQuantity) return;
    try {
      await branchStockApi.assign({
        productId: Number(selectedProductId),
        branchId: selectedBranch.id,
        quantity: Number(assignQuantity),
      });
      setShowAssignProduct(false);
      openBranchDetail(selectedBranch);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBranch) return;
    try {
      await productApi.create({
        ...addProductForm,
        categoryId: Number(addProductForm.categoryId),
        branchId: selectedBranch.id,
        currentStock: Number(addProductForm.currentStock),
        minimumStock: Number(addProductForm.minimumStock),
        cost: addProductForm.cost ? Number(addProductForm.cost) : undefined,
        price: addProductForm.price ? Number(addProductForm.price) : undefined,
      });
      setShowAddProduct(false);
      openBranchDetail(selectedBranch);
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  // ==============================
  // BRANCH DETAIL VIEW
  // ==============================
  if (selectedBranch) {
    const totalStock = branchProducts.reduce((s, p) => s + p.currentStock, 0);
    const totalValue = branchProducts.reduce((s, p) => s + (Number(p.price || 0) * p.currentStock), 0);
    const lowStock = branchProducts.filter((p) => p.isLowStock).length;

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={closeBranchDetail} className="p-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{selectedBranch.name}</h1>
                <span className="px-2.5 py-0.5 bg-primary-50 text-primary-600 text-xs font-mono font-bold rounded-lg">{selectedBranch.code}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {[selectedBranch.city, selectedBranch.address].filter(Boolean).join(' — ') || 'Sin dirección'}
              </p>
            </div>
          </div>
          <button onClick={() => openEdit(selectedBranch)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            <Edit3 className="w-4 h-4" /> Editar Sede
          </button>
        </div>

        {/* Branch Info + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Encargado</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{selectedBranch.manager || '—'}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Teléfono</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{selectedBranch.phone || '—'}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Productos</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{branchProducts.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Stock Total</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totalStock.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Valor Inventario</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">${totalValue.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Users assigned */}
        {selectedBranch.users && selectedBranch.users.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Usuarios asignados ({selectedBranch.users.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedBranch.users.map((u) => (
                <span key={u.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-primary-50 text-primary-600' : 'bg-blue-50 text-blue-600'} ${!u.isActive ? 'opacity-50' : ''}`}>
                  <Users className="w-3 h-3" /> {u.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-4">
          <button onClick={openAssignProduct}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
            <Plus className="w-4 h-4" /> Asignar Producto del Inventario
          </button>
          <button onClick={() => { setShowAddProduct(true); setAddProductForm({ name: '', sku: '', description: '', categoryId: '', unitOfMeasure: 'UNIT', currentStock: '0', minimumStock: '100', warehouseLocation: '', cost: '', price: '' }); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            <Plus className="w-4 h-4" /> Crear Producto Nuevo
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Inventario de la sede ({branchProducts.length} productos)</h3>
            {lowStock > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full">
                <AlertTriangle className="w-3 h-3" /> {lowStock} con stock bajo
              </span>
            )}
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : branchProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay productos en esta sede</p>
              <p className="text-sm text-gray-400 mt-1">Asigna productos a esta sede desde el módulo de Productos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Imagen</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {branchProducts.map((p) => (
                    <tr key={p.id} className="table-row-hover transition-colors">
                      <td className="px-5 py-3 text-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 mx-auto" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto"><Package className="w-5 h-5 text-gray-300" /></div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-mono text-primary-600 font-medium text-center">{p.sku}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-800 text-center">{p.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 text-center">{p.category?.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 text-center">{UNIT_LABELS[p.unitOfMeasure]}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 text-center">{p.warehouseLocation || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-sm font-bold ${p.isLowStock ? 'text-red-500' : 'text-gray-800'}`}>{p.currentStock}</span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-700 text-center">
                        {p.price ? `$${Number(p.price).toLocaleString('es-CO', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {p.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Bajo
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">OK</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center relative">
                        <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenu === p.id && (
                          <div className="absolute right-5 top-10 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 min-w-[180px]">
                            <button onClick={() => openProductEdit(p)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                              <Edit3 className="w-4 h-4 text-amber-500" /> Editar producto
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Product Modal */}
        <Modal isOpen={showEditProduct} onClose={() => setShowEditProduct(false)} title="Editar Producto en Sede" maxWidth="max-w-xl">
          {editProduct && (
            <form onSubmit={handleProductUpdate} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                {editProduct.imageUrl ? (
                  <img src={editProduct.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-800">{editProduct.name}</p>
                  <p className="text-xs text-gray-500">{editProduct.sku} · Sede: {selectedBranch?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select value={editForm.unitOfMeasure} onChange={(e) => setEditForm({ ...editForm, unitOfMeasure: e.target.value as UnitOfMeasure })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                    {Object.entries(UNIT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" min="0" value={editForm.minimumStock} onChange={(e) => setEditForm({ ...editForm, minimumStock: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <input value={editForm.warehouseLocation} onChange={(e) => setEditForm({ ...editForm, warehouseLocation: e.target.value })}
                    placeholder="Pasillo A"
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo adquisición</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input type="number" min="0" step="0.01" value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Add Stock */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Agregar Inventario</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Stock Actual</p>
                    <p className={`text-xl font-bold ${editProduct.isLowStock ? 'text-red-500' : 'text-gray-800'}`}>{editProduct.currentStock}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Agregar</p>
                    <input type="number" min="0" value={addStockAmount} onChange={(e) => setAddStockAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-center text-xl font-bold text-emerald-600 bg-transparent border-none focus:outline-none" />
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Nuevo Total</p>
                    <p className="text-xl font-bold text-emerald-600">{editProduct.currentStock + (Number(addStockAmount) || 0)}</p>
                  </div>
                </div>
                {addStockAmount && Number(addStockAmount) > 0 && (
                  <p className="text-xs text-blue-600 font-medium">Se registrará una entrada de {addStockAmount} unidades al guardar</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditProduct(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Branch Edit Modal (reused) */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Editar Sede" maxWidth="max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input value={formData.code} disabled className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm opacity-60" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label><input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label><input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Encargado</label><input value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">Guardar</button>
            </div>
          </form>
        </Modal>

        {/* Assign Product Modal */}
        <Modal isOpen={showAssignProduct} onClose={() => setShowAssignProduct(false)} title={`Asignar Producto a ${selectedBranch?.name}`} maxWidth="max-w-2xl">
          <form onSubmit={handleAssignProduct} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">Selecciona un producto del inventario general y asigna la cantidad que deseas enviar a esta sede. El stock del producto origen se reducirá automáticamente.</p>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar producto por nombre o SKU..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
              />
            </div>

            {/* Product list */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {orgProducts
                .filter(p => !assignSearch || p.name.toLowerCase().includes(assignSearch.toLowerCase()) || p.sku.toLowerCase().includes(assignSearch.toLowerCase()))
                .map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(String(p.id))}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selectedProductId === String(p.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku} · {p.category?.name} · Stock total: {p.currentStock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Disponible</p>
                    <p className="text-lg font-bold text-emerald-600">{(p as any).availableStock ?? p.currentStock}</p>
                  </div>
                </div>
              ))}
              {orgProducts.filter(p => !assignSearch || p.name.toLowerCase().includes(assignSearch.toLowerCase()) || p.sku.toLowerCase().includes(assignSearch.toLowerCase())).length === 0 && (
                <p className="text-center py-8 text-gray-400 text-sm">No hay productos disponibles para asignar</p>
              )}
            </div>

            {/* Quantity */}
            {selectedProductId && (() => {
              const sp: any = orgProducts.find(p => p.id === Number(selectedProductId));
              if (!sp) return null;
              const avail = sp.availableStock ?? sp.currentStock;
              return (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800">{sp.name}</p>
                    <div className="text-right text-xs text-gray-500">
                      <p>Stock total: <span className="font-bold text-gray-700">{sp.currentStock}</span></p>
                      <p>Ya asignado: <span className="font-bold text-amber-600">{sp.totalAssigned || 0}</span></p>
                      <p>Disponible: <span className="font-bold text-emerald-600">{avail}</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Disponible</p>
                      <p className="text-lg font-bold text-emerald-600">{avail}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Asignar</p>
                      <input required type="number" min="1" max={avail} value={assignQuantity} onChange={(e) => setAssignQuantity(e.target.value)}
                        placeholder="0"
                        className="w-full text-center text-lg font-bold text-primary-600 bg-transparent border-none focus:outline-none" />
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Quedará</p>
                      <p className="text-lg font-bold text-amber-600">{avail - (Number(assignQuantity) || 0)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAssignProduct(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" disabled={!selectedProductId || !assignQuantity}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Asignar a Sede
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Product Modal */}
        <Modal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} title={`Agregar Producto a ${selectedBranch?.name}`} maxWidth="max-w-xl">
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input required value={addProductForm.name} onChange={(e) => setAddProductForm({ ...addProductForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input required value={addProductForm.sku} onChange={(e) => setAddProductForm({ ...addProductForm, sku: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input value={addProductForm.description} onChange={(e) => setAddProductForm({ ...addProductForm, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select required value={addProductForm.categoryId} onChange={(e) => setAddProductForm({ ...addProductForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
                <select value={addProductForm.unitOfMeasure} onChange={(e) => setAddProductForm({ ...addProductForm, unitOfMeasure: e.target.value as UnitOfMeasure })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                  {Object.entries(UNIT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                <input type="number" min="0" value={addProductForm.currentStock} onChange={(e) => setAddProductForm({ ...addProductForm, currentStock: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <input type="number" min="0" value={addProductForm.minimumStock} onChange={(e) => setAddProductForm({ ...addProductForm, minimumStock: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input value={addProductForm.warehouseLocation} onChange={(e) => setAddProductForm({ ...addProductForm, warehouseLocation: e.target.value })}
                  placeholder="Pasillo A, Estante 1"
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo adquisición</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input type="number" min="0" step="0.01" value={addProductForm.cost} onChange={(e) => setAddProductForm({ ...addProductForm, cost: e.target.value })}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input type="number" min="0" step="0.01" value={addProductForm.price} onChange={(e) => setAddProductForm({ ...addProductForm, price: e.target.value })}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddProduct(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">Crear Producto</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==============================
  // BRANCHES GRID VIEW
  // ==============================
  return (
    <div>
      <Header title="Sedes" subtitle="Administra las sucursales de la empresa" />

      <div className="flex justify-end mb-5">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
          <Plus className="w-4 h-4" /> Nueva Sede
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((branch) => (
          <div key={branch.id} onClick={() => openBranchDetail(branch)}
            className={`bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group ${branch.isActive ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition">
                  <MapPin className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">{branch.name}</h3>
                  <p className="text-xs text-primary-600 font-mono font-medium">{branch.code}</p>
                </div>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(branch)} className="p-2 hover:bg-gray-100 rounded-lg transition"><Edit3 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => handleDelete(branch.id)} className="p-2 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>

            {branch.city && <p className="text-sm text-gray-500 mb-1">{branch.city}</p>}
            {branch.address && <p className="text-xs text-gray-400 mb-3">{branch.address}</p>}

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center"><Users className="w-4 h-4 text-gray-400 mx-auto mb-0.5" /><p className="text-sm font-bold text-gray-800">{branch._count.users}</p><p className="text-[10px] text-gray-400">Usuarios</p></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><Package className="w-4 h-4 text-gray-400 mx-auto mb-0.5" /><p className="text-sm font-bold text-gray-800">{branch._count.products}</p><p className="text-[10px] text-gray-400">Productos</p></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><Building2 className="w-4 h-4 text-gray-400 mx-auto mb-0.5" /><p className="text-sm font-bold text-gray-800">{branch._count.movements}</p><p className="text-[10px] text-gray-400">Movimientos</p></div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              {branch.manager && <span className="text-gray-500">Encargado: <span className="font-medium text-gray-700">{branch.manager}</span></span>}
              <span className="text-primary-500 font-medium group-hover:text-primary-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver detalle</span>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay sedes registradas</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Sede' : 'Nueva Sede'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Sede Norte" className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Código *</label><input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="SEDE-01" disabled={!!editing} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label><input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label><input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Encargado</label><input value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} placeholder="Nombre del responsable" className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">{editing ? 'Guardar' : 'Crear Sede'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
