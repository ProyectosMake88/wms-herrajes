import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  color: 'purple' | 'blue' | 'green' | 'orange' | 'red';
}

const colorMap = {
  purple: { bg: 'bg-primary-50', icon: 'bg-primary-500', text: 'text-primary-600' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
  orange: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
};

export default function StatsCard({ title, value, icon, subtitle, color }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className={`text-xs mt-1.5 ${c.text} font-medium`}>{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
    </div>
  );
}
