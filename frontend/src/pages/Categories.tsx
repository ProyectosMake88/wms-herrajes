import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Tags, Package } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { categoryApi } from '../services/api';
import { Category } from '../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

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

  function openEdit(cat: Category) {
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

  async function handleDelete(id: number) {
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
          <div key={cat.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <Tags className="w-6 h-6 text-primary-500" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800">{cat.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description || 'Sin descripción'}</p>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">{cat.products?.length || 0} productos</span>
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
