import { useEffect, useState } from 'react';
import {
  Plus, Building2, Users, Package, ArrowLeftRight, Eye, Edit3,
  ToggleLeft, ToggleRight, Crown, MapPin, BarChart3,
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import StatsCard from '../components/ui/StatsCard';
import { organizationApi } from '../services/api';

interface Organization {
  id: number;
  name: string;
  nit: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  planType: string;
  isActive: boolean;
  createdAt: string;
  _count: { users: number; branches: number; products: number; movements: number };
}

interface Stats {
  totalOrgs: number;
  activeOrgs: number;
  totalUsers: number;
  totalProducts: number;
  totalMovements: number;
}

const planColors: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-50 text-blue-600',
  enterprise: 'bg-amber-50 text-amber-600',
};

export default function Organizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', nit: '', email: '', phone: '', address: '', website: '', planType: 'basic',
    adminName: '', adminEmail: '', adminPassword: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [orgsRes, statsRes] = await Promise.all([organizationApi.getAll(), organizationApi.getStats()]);
      setOrgs(orgsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await organizationApi.create(formData);
      setShowModal(false);
      setFormData({ name: '', nit: '', email: '', phone: '', address: '', website: '', planType: 'basic', adminName: '', adminEmail: '', adminPassword: '' });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleToggle(id: number) {
    try {
      await organizationApi.toggleActive(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function openDetail(id: number) {
    try {
      const res = await organizationApi.getById(id);
      setShowDetail(res.data);
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Organizaciones" subtitle="Panel de Super Administrador - Gestión multi-empresa" />

      {/* Global Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatsCard title="Organizaciones" value={stats.totalOrgs} icon={<Building2 className="w-6 h-6" />} color="purple" subtitle={`${stats.activeOrgs} activas`} />
          <StatsCard title="Usuarios Totales" value={stats.totalUsers} icon={<Users className="w-6 h-6" />} color="blue" />
          <StatsCard title="Productos Totales" value={stats.totalProducts} icon={<Package className="w-6 h-6" />} color="green" />
          <StatsCard title="Movimientos" value={stats.totalMovements} icon={<ArrowLeftRight className="w-6 h-6" />} color="orange" />
          <StatsCard title="Plataforma" value="AdVenty" icon={<Crown className="w-6 h-6" />} color="purple" subtitle="SaaS Inventarios" />
        </div>
      )}

      <div className="flex justify-end mb-5">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
          <Plus className="w-4 h-4" /> Nueva Organización
        </button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orgs.map((org) => (
          <div key={org.id} className={`bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow ${org.isActive ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-gray-800">{org.name}</h3>
                  {org.nit && <p className="text-xs text-gray-500">NIT: {org.nit}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openDetail(org.id)} className="p-2 hover:bg-gray-100 rounded-lg transition"><Eye className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => handleToggle(org.id)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  {org.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-gray-800">{org._count.users}</p><p className="text-[9px] text-gray-400">Usuarios</p></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-gray-800">{org._count.branches}</p><p className="text-[9px] text-gray-400">Sedes</p></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-gray-800">{org._count.products}</p><p className="text-[9px] text-gray-400">Productos</p></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-gray-800">{org._count.movements}</p><p className="text-[9px] text-gray-400">Movimientos</p></div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${planColors[org.planType] || planColors.basic}`}>{org.planType}</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${org.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {org.isActive ? 'Activa' : 'Suspendida'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Organization Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Organización" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">Se creará la organización y su usuario administrador automáticamente.</p>

          <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-3">Datos de la Empresa</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Herrajes del Norte S.A.S"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">NIT</label>
                <input value={formData.nit} onChange={(e) => setFormData({ ...formData, nit: e.target.value })} placeholder="900.123.456-7"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sitio web</label>
                <input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                <select value={formData.planType} onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">Administrador de la Organización</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input required value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña *</label>
                <input required type="password" minLength={6} value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">Crear Organización</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detalle de Organización" maxWidth="max-w-2xl">
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              {showDetail.logoUrl ? (
                <img src={showDetail.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center"><Building2 className="w-8 h-8 text-primary-400" /></div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-800">{showDetail.name}</h3>
                {showDetail.nit && <p className="text-sm text-gray-500">NIT: {showDetail.nit}</p>}
                <p className="text-xs text-gray-400">{showDetail.email} · {showDetail.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-primary-600">{showDetail._count.products}</p><p className="text-xs text-gray-500">Productos</p></div>
              <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-600">{showDetail._count.movements}</p><p className="text-xs text-gray-500">Movimientos</p></div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{showDetail._count.categories}</p><p className="text-xs text-gray-500">Categorías</p></div>
            </div>

            {showDetail.branches?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">Sedes ({showDetail.branches.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {showDetail.branches.map((b: any) => (
                    <span key={b.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-700">
                      <MapPin className="w-3 h-3 text-primary-500" /> {b.name} ({b.code})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {showDetail.users?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">Usuarios ({showDetail.users.length})</h4>
                <div className="space-y-1.5">
                  {showDetail.users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{u.name}</span>
                        <span className="text-xs text-gray-400">{u.email}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-primary-50 text-primary-600' : 'bg-blue-50 text-blue-600'}`}>
                        {u.role === 'ADMIN' ? 'Admin' : 'Vendedor'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
