import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent w-64 shadow-sm"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            3
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800 leading-tight">Admin</p>
            <p className="text-[11px] text-gray-400 leading-tight">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
