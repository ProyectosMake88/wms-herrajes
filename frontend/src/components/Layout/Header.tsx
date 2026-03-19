import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, User, AlertTriangle, ShoppingBag, ArrowDownToLine,
  PackageX, Check, CheckCheck, Building2, Camera, Save, X,
  Clock, CheckCircle, XCircle, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { notificationApi, companyApi } from '../../services/api';
import Modal from '../ui/Modal';

interface Notification {
  id: number;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'SALE' | 'ENTRY';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  product?: { id: number; name: string; sku: string } | null;
  user?: { id: number; name: string; role: string } | null;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const typeConfig = {
  LOW_STOCK: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  OUT_OF_STOCK: { icon: PackageX, color: 'text-red-500', bg: 'bg-red-50' },
  SALE: { icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
  ENTRY: { icon: ArrowDownToLine, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  PENDING_ENTRY: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  ENTRY_APPROVED: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ENTRY_REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, isAdmin } = useAuth();
  const { company, reload: reloadCompany } = useCompany();
  const navigate = useNavigate();

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Company profile modal
  const [showProfile, setShowProfile] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [companyForm, setCompanyForm] = useState({
    name: '', nit: '', address: '', phone: '', email: '', website: '',
  });

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {}
  }

  async function handleMarkAsRead(id: number) {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  async function handleMarkAllAsRead() {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  function openProfile() {
    setCompanyForm({
      name: company?.name || '',
      nit: company?.nit || '',
      address: company?.address || '',
      phone: company?.phone || '',
      email: company?.email || '',
      website: company?.website || '',
    });
    setLogoPreview(null);
    setLogoFile(null);
    setShowProfile(true);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await companyApi.updateProfile(companyForm, logoFile || undefined);
      await reloadCompany();
      setShowProfile(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const displayLogo = logoPreview || company?.logoUrl;

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) loadNotifications(); }}
              className="relative p-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Notificaciones</h3>
                    {unreadCount > 0 && <p className="text-[11px] text-gray-500">{unreadCount} sin leer</p>}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                      <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No hay notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const config = typeConfig[notif.type] || typeConfig.ENTRY;
                      const Icon = config.icon;
                      const isClickable = notif.type === 'PENDING_ENTRY' && isAdmin;
                      const handleClick = () => {
                        if (isClickable) {
                          handleMarkAsRead(notif.id);
                          setShowNotifications(false);
                          navigate('/approvals');
                        }
                      };
                      return (
                        <div
                          key={notif.id}
                          onClick={handleClick}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition hover:bg-gray-50/80 ${!notif.isRead ? 'bg-primary-50/30' : ''} ${isClickable ? 'cursor-pointer' : ''}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bg}`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(notif.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                            {isClickable && (
                              <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary-600 font-semibold hover:text-primary-700">
                                <ExternalLink className="w-3 h-3" /> Revisar solicitud
                              </span>
                            )}
                          </div>
                          {!notif.isRead && (
                            <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }} className="p-1 hover:bg-gray-200 rounded-md transition flex-shrink-0 mt-0.5" title="Marcar como leída">
                              <Check className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User / Company Button */}
          {user?.role === 'SUPER_ADMIN' ? (
            <button
              onClick={openProfile}
              className="flex items-center gap-3 bg-white rounded-xl border border-amber-200 px-3 py-2 shadow-sm hover:bg-amber-50 transition cursor-pointer"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-amber-500 leading-tight font-medium">Super Admin</p>
              </div>
            </button>
          ) : (
            <button
              onClick={openProfile}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm hover:bg-gray-50 transition cursor-pointer"
            >
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-gray-400 leading-tight">{user?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}</p>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Company Profile Modal */}
      <Modal isOpen={showProfile} onClose={() => setShowProfile(false)} title={user?.role === 'SUPER_ADMIN' ? 'Perfil Super Admin' : 'Perfil de la Empresa'} maxWidth="max-w-xl">
        {/* Super Admin Profile */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-amber-50 rounded-2xl flex items-center justify-center border-2 border-amber-200">
                <Building2 className="w-12 h-12 text-amber-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Nombre</p><p className="text-sm font-bold">{user.name}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Email</p><p className="text-sm font-bold">{user.email}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Rol</p><p className="text-sm font-bold text-amber-600">Super Administrador</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Plataforma</p><p className="text-sm font-bold text-primary-600">AdVenty</p></div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 font-medium">Tienes acceso total a la plataforma. Puedes crear y gestionar organizaciones, ver estadísticas globales y administrar todos los datos.</p>
            </div>
          </div>
        )}

        {/* Company Profile (Admin/Seller) */}
        {user?.role !== 'SUPER_ADMIN' && (
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Logo Upload */}
          <div className="flex flex-col items-center">
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
            <div className="relative group cursor-pointer" onClick={() => isAdmin && logoInputRef.current?.click()}>
              {displayLogo ? (
                <img src={displayLogo} alt="Logo" className="w-28 h-28 rounded-2xl object-cover border-2 border-gray-200 shadow-sm" />
              ) : (
                <div className="w-28 h-28 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                  <Building2 className="w-10 h-10 text-gray-300" />
                  <span className="text-[10px] text-gray-400 mt-1">Logo empresa</span>
                </div>
              )}
              {isAdmin && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            {isAdmin && <p className="text-xs text-gray-400 mt-2">Haz clic para cambiar el logo</p>}
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
              <input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
              <input value={companyForm.nit} onChange={(e) => setCompanyForm({ ...companyForm, nit: e.target.value })}
                disabled={!isAdmin} placeholder="900.123.456-7"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                disabled={!isAdmin}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
              <input value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                disabled={!isAdmin} placeholder="https://..."
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-60" />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowProfile(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          )}
        </form>
        )}
      </Modal>
    </>
  );
}
