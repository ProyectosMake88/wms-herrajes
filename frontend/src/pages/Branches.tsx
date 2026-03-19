import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, MapPin, Users, Package, Eye, Phone, Building2 } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { branchApi } from '../services/api';

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
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [showDetail, setShowDetail] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '', city: '', phone: '', manager: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await branchApi.getAll();
      setBranches(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormData({ name: '', code: '', address: '', city: '', phone: '', manager: '' });
    setShowModal(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      manager: branch.manager || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await branchApi.update(editing.id, formData);
      } else {
        await branchApi.create(formData);
      }
      setShowModal(false);
      loadData();
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

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

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
          <div key={branch.id} className={`bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow ${branch.isActive ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">{branch.name}</h3>
                  <p className="text-xs text-primary-600 font-mono font-medium">{branch.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowDetail(branch)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => openEdit(branch)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(branch.id)} className="p-2 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {branch.city && <p className="text-sm text-gray-500 mb-1">{branch.city}</p>}
            {branch.address && <p className="text-xs text-gray-400 mb-3">{branch.address}</p>}

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <Users className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-gray-800">{branch._count.users}</p>
                <p className="text-[10px] text-gray-400">Usuarios</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <Package className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-gray-800">{branch._count.products}</p>
                <p className="text-[10px] text-gray-400">Productos</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <Building2 className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-gray-800">{branch._count.movements}</p>
                <p className="text-[10px] text-gray-400">Movimientos</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              {branch.manager && <span className="text-gray-500">Encargado: <span className="font-medium text-gray-700">{branch.manager}</span></span>}
              <span className={`px-2 py-0.5 rounded-full font-bold ${branch.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {branch.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay sedes registradas</p>
            <p className="text-sm text-gray-400 mt-1">Crea tu primera sede para organizar el inventario</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Sede' : 'Nueva Sede'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la sede *</label>
              <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Sede Norte"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ej: SEDE-01"
                disabled={!!editing}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Encargado</label>
            <input value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              placeholder="Nombre del responsable de la sede"
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              {editing ? 'Guardar Cambios' : 'Crear Sede'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle de la Sede">
        {showDetail && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Nombre</p><p className="text-sm font-bold">{showDetail.name}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Código</p><p className="text-sm font-bold font-mono">{showDetail.code}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Ciudad</p><p className="text-sm font-bold">{showDetail.city || '—'}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Teléfono</p><p className="text-sm font-bold">{showDetail.phone || '—'}</p></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Dirección</p><p className="text-sm font-bold">{showDetail.address || '—'}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Encargado</p><p className="text-sm font-bold">{showDetail.manager || '—'}</p></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-primary-600">{showDetail._count.users}</p><p className="text-xs text-gray-500">Usuarios</p></div>
              <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-600">{showDetail._count.products}</p><p className="text-xs text-gray-500">Productos</p></div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{showDetail._count.movements}</p><p className="text-xs text-gray-500">Movimientos</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
