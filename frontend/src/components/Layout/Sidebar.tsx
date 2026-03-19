import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, ArrowLeftRight, BarChart3,
  AlertTriangle, Warehouse, Users, ShoppingBag, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/categories', icon: Tags, label: 'Categorías' },
  { to: '/movements', icon: ArrowLeftRight, label: 'Movimientos' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alertas Stock' },
  { to: '/users', icon: Users, label: 'Usuarios' },
];

const sellerNav = [
  { to: '/', icon: ShoppingBag, label: 'Registrar Venta' },
  { to: '/products', icon: Package, label: 'Ver Productos' },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navItems = isAdmin ? adminNav : sellerNav;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary-700 via-primary-800 to-primary-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-primary-600/40">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Warehouse className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">WMS</h1>
          <p className="text-[11px] text-primary-200 leading-tight">Herrajes Inventario</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-[10px] text-primary-300 uppercase font-semibold tracking-wider mb-2">
          {isAdmin ? 'Administración' : 'Ventas'}
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-primary-700 shadow-lg shadow-primary-900/30'
                  : 'text-primary-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-4 pb-6 space-y-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-400/30 rounded-lg flex items-center justify-center">
              {isAdmin ? <Users className="w-4 h-4 text-primary-100" /> : <ShoppingBag className="w-4 h-4 text-primary-100" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-primary-300">{isAdmin ? 'Administrador' : 'Vendedor'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary-200 hover:text-white hover:bg-white/10 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
