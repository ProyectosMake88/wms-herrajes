import { useEffect, useState } from 'react';
import { Plus, UserCheck, UserX, Shield, ShoppingBag, Edit3, Trash2 } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { authApi } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'SELLER';
  isActive: boolean;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SELLER' });

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const res = await authApi.getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormData({ name: '', email: '', password: '', role: 'SELLER' });
    setShowModal(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await authApi.updateUser(editing.id, { name: formData.name, role: formData.role });
      } else {
        await authApi.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      }
      setShowModal(false);
      loadUsers();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleToggleActive(user: User) {
    const action = user.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿${action} al usuario "${user.name}"?`)) return;
    try {
      await authApi.updateUser(user.id, { isActive: !user.isActive });
      loadUsers();
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Gestión de Usuarios" subtitle="Administra los accesos al sistema" />

      <div className="flex justify-end mb-5">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((user) => (
          <div key={user.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-shadow hover:shadow-md ${user.isActive ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-primary-50' : 'bg-blue-50'}`}>
                  {user.role === 'ADMIN' ? (
                    <Shield className="w-6 h-6 text-primary-500" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-blue-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(user)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleToggleActive(user)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  {user.isActive ? <UserX className="w-4 h-4 text-red-400" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                user.role === 'ADMIN'
                  ? 'bg-primary-50 text-primary-600'
                  : 'bg-blue-50 text-blue-600'
              }`}>
                {user.role === 'ADMIN' ? (
                  <><Shield className="w-3 h-3" /> Administrador</>
                ) : (
                  <><ShoppingBag className="w-3 h-3" /> Vendedor</>
                )}
              </span>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              Creado: {new Date(user.createdAt).toLocaleDateString('es-CO')}
            </div>

            {/* Permissions info */}
            <div className="mt-2 p-2.5 bg-gray-50 rounded-xl">
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Permisos</p>
              {user.role === 'ADMIN' ? (
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li>- Acceso total al sistema</li>
                  <li>- Crear/editar productos y categorías</li>
                  <li>- Registrar entradas y salidas</li>
                  <li>- Ver reportes y alertas</li>
                  <li>- Gestionar usuarios</li>
                </ul>
              ) : (
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li>- Registrar salidas (ventas)</li>
                  <li>- Ver productos disponibles</li>
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit User Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Usuario' : 'Nuevo Vendedor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
          </div>

          {!editing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vendedor@herrajes.com"
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input required type="password" minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setFormData({ ...formData, role: 'SELLER' })}
                className={`p-3 rounded-xl border-2 text-center transition ${formData.role === 'SELLER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <ShoppingBag className={`w-6 h-6 mx-auto mb-1 ${formData.role === 'SELLER' ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-800">Vendedor</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Solo registrar ventas</p>
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                className={`p-3 rounded-xl border-2 text-center transition ${formData.role === 'ADMIN' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <Shield className={`w-6 h-6 mx-auto mb-1 ${formData.role === 'ADMIN' ? 'text-primary-500' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-800">Administrador</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Acceso total</p>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              {editing ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
