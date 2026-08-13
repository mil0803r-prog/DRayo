import React from 'react';
import { TabType } from '../types';
import { LayoutDashboard, MessageCircle, Megaphone, Package, Share2, FileText } from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unexportedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, unexportedCount }) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard General',
      icon: LayoutDashboard,
    },
    {
      id: 'sales' as TabType,
      label: 'Ventas por Día (WhatsApp)',
      icon: MessageCircle,
    },
    {
      id: 'meta_ads' as TabType,
      label: 'Gastos Meta Ads',
      icon: Megaphone,
      badge: 'PDFs 2026'
    },
    {
      id: 'inventory' as TabType,
      label: 'Inventario & Costos',
      icon: Package,
    },
    {
      id: 'meta_export' as TabType,
      label: 'Exportar a Meta (Offline)',
      icon: Share2,
      badge: unexportedCount > 0 ? `${unexportedCount} pendientes` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      id: 'templates' as TabType,
      label: 'Plantillas WhatsApp',
      icon: FileText,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-slate-800 text-blue-300 border-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

