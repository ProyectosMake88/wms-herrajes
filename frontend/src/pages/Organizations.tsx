import { useEffect, useState } from 'react';
import {
  Plus, Building2, Users, Package, ArrowLeftRight, Eye, Edit3,
  ToggleLeft, ToggleRight, Crown, MapPin, BarChart3, ArrowLeft,
  Shield, ShoppingBag, UserCheck, UserX, Trash2,
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import StatsCard from '../components/ui/StatsCard';
import { organizationApi, authApi, branchApi } from '../services/api';

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
  _count: { users: number; branches: number; products: number; movements: number; categories?: number };
  users?: OrgUser[];
  branches?: { id: number; name: string; code: string; city: string | null; isActive: boolean }[];
}

interface OrgUser {
  id: number; name: string; email: string; role: string; isActive: boolean;
  branch?: { name: string } | null;
}

interface Stats { totalOrgs: number; activeOrgs: number; totalUsers: number; totalProducts: number; totalMovements: number; }

const planColors: Record<string, string> = { basic: 'bg-gray-100 text-gray-600', pro: 'bg-blue-50 text-blue-600', enterprise: 'bg-amber-50 text-amber-600' };

export default function Organizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', nit: '', email: '', phone: '', address: '', website: '', planType: 'basic', adminName: '', adminEmail: '', adminPassword: '' });

  // Detail view
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [orgBranches, setOrgBranches] = useState<any[]>([]);

  // Create user in org
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'SELLER', branchId: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [orgsRes, statsRes] = await Promise.all([organizationApi.getAll(), organizationApi.getStats()]);
      setOrgs(orgsRes.data);
      setStats(statsRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  async function openOrgDetail(orgId: number) {
    try {
      const res = await organizationApi.getById(orgId);
      const org = res.data;
      setSelectedOrg(org);
      setOrgUsers(org.users || []);
      setOrgBranches(org.branches || []);
    } catch (error: any) { alert(error.message); }
  }

  function closeDetail() { setSelectedOrg(null); setOrgUsers([]); setOrgBranches([]); }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    try {
      await organizationApi.create(orgForm);
      setShowCreateOrg(false);
      setOrgForm({ name: '', nit: '', email: '', phone: '', address: '', website: '', planType: 'basic', adminName: '', adminEmail: '', adminPassword: '' });
      loadData();
    } catch (error: any) { alert(error.message); }
  }

  async function handleToggle(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try { await organizationApi.toggleActive(id); loadData(); } catch (error: any) { alert(error.message); }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await authApi.createUser({
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        organizationId: selectedOrg.id,
        branchId: userForm.branchId ? Number(userForm.branchId) : undefined,
      });
      setShowCreateUser(false);
      setUserForm({ name: '', email: '', password: '', role: 'SELLER', branchId: '' });
      openOrgDetail(selectedOrg.id);
      loadData();
    } catch (error: any) { alert(error.message); }
  }

  async function handleToggleUser(userId: number) {
    try {
      const user = orgUsers.find(u => u.id === userId);
      if (!user) return;
      await authApi.updateUser(userId, { isActive: !user.isActive });
      if (selectedOrg) openOrgDetail(selectedOrg.id);
    } catch (error: any) { alert(error.message); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  // ==============================
  // ORG DETAIL VIEW
  // ==============================
  if (selectedOrg) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={closeDetail} className="p-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              {selectedOrg.logoUrl ? (
                <img src={selectedOrg.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-primary-500" /></div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedOrg.name}</h1>
                <p className="text-sm text-gray-500">{selectedOrg.nit ? `NIT: ${selectedOrg.nit}` : ''} {selectedOrg.email ? `· ${selectedOrg.email}` : ''}</p>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${planColors[selectedOrg.planType] || planColors.basic}`}>{selectedOrg.planType}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard title="Usuarios" value={orgUsers.length} icon={<Users className="w-6 h-6" />} color="blue" />
          <StatsCard title="Sedes" value={orgBranches.length} icon={<MapPin className="w-6 h-6" />} color="purple" />
          <StatsCard title="Productos" value={selectedOrg._count?.products || 0} icon={<Package className="w-6 h-6" />} color="green" />
          <StatsCard title="Movimientos" value={selectedOrg._count?.movements || 0} icon={<ArrowLeftRight className="w-6 h-6" />} color="orange" />
        </div>

        {/* Branches */}
        {orgBranches.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Sedes ({orgBranches.length})</h3>
            <div className="flex flex-wrap gap-2">
              {orgBranches.map((b: any) => (
                <span key={b.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${b.isActive ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                  <MapPin className="w-3 h-3" /> {b.name} ({b.code}) {b.city ? `· ${b.city}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Usuarios de la organización ({orgUsers.length})</h3>
            <button onClick={() => { setShowCreateUser(true); setUserForm({ name: '', email: '', password: '', role: 'SELLER', branchId: '' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
              <Plus className="w-4 h-4" /> Nuevo Usuario
            </button>
          </div>

          {orgUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay usuarios en esta organización</p>
              <p className="text-sm text-gray-400 mt-1">Crea el primer usuario para esta empresa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sede</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orgUsers.map((u) => (
                    <tr key={u.id} className="table-row-hover transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${u.role === 'ADMIN' ? 'bg-primary-50' : 'bg-blue-50'}`}>
                            {u.role === 'ADMIN' ? <Shield className="w-4 h-4 text-primary-500" /> : <ShoppingBag className="w-4 h-4 text-blue-500" />}
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-primary-50 text-primary-600' : 'bg-blue-50 text-blue-600'}`}>
                          {u.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 text-center">{u.branch?.name || '—'}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button onClick={() => handleToggleUser(u.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title={u.isActive ? 'Desactivar' : 'Activar'}>
                          {u.isActive ? <UserX className="w-4 h-4 text-red-400" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        <Modal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} title={`Nuevo Usuario en ${selectedOrg.name}`}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
              <input required type="password" minLength={6} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setUserForm({ ...userForm, role: 'SELLER' })}
                  className={`p-3 rounded-xl border-2 text-center transition ${userForm.role === 'SELLER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <ShoppingBag className={`w-6 h-6 mx-auto mb-1 ${userForm.role === 'SELLER' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-semibold text-gray-800">Vendedor</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Solo registrar ventas</p>
                </button>
                <button type="button" onClick={() => setUserForm({ ...userForm, role: 'ADMIN' })}
                  className={`p-3 rounded-xl border-2 text-center transition ${userForm.role === 'ADMIN' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <Shield className={`w-6 h-6 mx-auto mb-1 ${userForm.role === 'ADMIN' ? 'text-primary-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-semibold text-gray-800">Administrador</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Acceso total a la org</p>
                </button>
              </div>
            </div>
            {orgBranches.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sede asignada</label>
                <select value={userForm.branchId} onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
                  <option value="">Sin sede (acceso global)</option>
                  {orgBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateUser(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">Crear Usuario</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==============================
  // ORGS GRID VIEW
  // ==============================
  return (
    <div>
      <Header title="Organizaciones" subtitle="Panel de Super Administrador - Gestión multi-empresa" />

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
        <button onClick={() => setShowCreateOrg(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">
          <Plus className="w-4 h-4" /> Nueva Organización
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orgs.map((org) => (
          <div key={org.id} onClick={() => openOrgDetail(org.id)}
            className={`bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group ${org.isActive ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition">
                    <Building2 className="w-6 h-6 text-primary-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-gray-800">{org.name}</h3>
                  {org.nit && <p className="text-xs text-gray-500">NIT: {org.nit}</p>}
                </div>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => handleToggle(org.id, e)} className="p-2 hover:bg-gray-100 rounded-lg transition">
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
              <span className="text-primary-500 font-medium group-hover:text-primary-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Gestionar</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Org Modal */}
      <Modal isOpen={showCreateOrg} onClose={() => setShowCreateOrg(false)} title="Nueva Organización" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">Se creará la organización y su usuario administrador automáticamente.</p>
          <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-3">Datos de la Empresa</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label><input required value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">NIT</label><input value={orgForm.nit} onChange={(e) => setOrgForm({ ...orgForm, nit: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><input type="email" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label><input value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label><input value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Plan</label><select value={orgForm.planType} onChange={(e) => setOrgForm({ ...orgForm, planType: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"><option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></div>
            </div>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">Administrador de la Organización</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label><input required value={orgForm.adminName} onChange={(e) => setOrgForm({ ...orgForm, adminName: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Email *</label><input required type="email" value={orgForm.adminEmail} onChange={(e) => setOrgForm({ ...orgForm, adminEmail: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Contraseña *</label><input required type="password" minLength={6} value={orgForm.adminPassword} onChange={(e) => setOrgForm({ ...orgForm, adminPassword: e.target.value })} className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" /></div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateOrg(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200">Crear Organización</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
