import { useState, useEffect, useRef } from 'react';
import {
  Bell, User, AlertTriangle, ShoppingBag, ArrowDownToLine,
  PackageX, Check, CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';

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
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silently fail
    }
  }

  async function handleMarkAsRead(id: number) {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) loadNotifications(); }}
            className="relative p-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <p className="text-[11px] text-gray-500">{unreadCount} sin leer</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No hay notificaciones</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const config = typeConfig[notif.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition hover:bg-gray-50/80 ${
                          !notif.isRead ? 'bg-primary-50/30' : ''
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bg}`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(notif.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                            className="p-1 hover:bg-gray-200 rounded-md transition flex-shrink-0 mt-0.5"
                            title="Marcar como leída"
                          >
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

        {/* User */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{user?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
