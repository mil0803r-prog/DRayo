import React from 'react';
import { TabType } from '../types';
import {
  LayoutDashboard,
  MessageCircle,
  Megaphone,
  Package,
  Calculator,
  Share2,
  FileText,
  Sparkles,
  Settings,
  Zap,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Bot,
  X,
  Layers,
  BarChart3,
  Database,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unexportedCount: number;
  salesCount: number;
  productsCount: number;
  totalNetProfit: number;
  roas: number;
  onOpenNewSaleModal: () => void;
  onOpenNewExpenseModal: () => void;
  onOpenAIAssistant: () => void;
  onOpenAISettings: () => void;
  onResetData: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unexportedCount,
  salesCount,
  productsCount,
  totalNetProfit,
  roas,
  onOpenNewSaleModal,
  onOpenNewExpenseModal,
  onOpenAIAssistant,
  onOpenAISettings,
  onResetData,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const mainNavItems: NavItem[] = [
    {
      id: 'dashboard' as TabType,
      label: 'Análisis Pro',
      shortLabel: 'Análisis Pro',
      icon: LayoutDashboard,
      description: 'Métricas, ROAS & Finanzas',
    },
    {
      id: 'sales' as TabType,
      label: 'Ventas WhatsApp',
      shortLabel: 'Ventas',
      icon: MessageCircle,
      description: 'Gestión de pedidos por chat',
    },
    {
      id: 'inventory' as TabType,
      label: 'Inventario',
      shortLabel: 'Inventario',
      icon: Package,
      description: 'Control de stock y COGS',
    },
    {
      id: 'pricing' as TabType,
      label: 'Calculadora',
      shortLabel: 'Calculadora',
      icon: Calculator,
      description: 'Margen real y ofertas de combos',
    },
    {
      id: 'indirect_costs' as TabType,
      label: 'Costos Indirectos',
      shortLabel: 'Costos Fijos',
      icon: Building2,
      description: 'Alquiler, taller, servicios y software',
    },
    {
      id: 'meta_ads' as TabType,
      label: 'Gastos Meta',
      shortLabel: 'Gastos Meta',
      icon: Megaphone,
      description: 'Facturas de publicidad',
    },
  ];

  const toolsNavItems: NavItem[] = [
    {
      id: 'database' as TabType,
      label: 'Base de Datos',
      shortLabel: 'Base de Datos',
      icon: Database,
      description: 'Tablas, backups y sync',
    },
    {
      id: 'meta_export' as TabType,
      label: 'Conversiones Offline',
      shortLabel: 'Offline Meta',
      icon: Share2,
      description: 'Eventos para CAPI / Pixel',
    },
    {
      id: 'templates' as TabType,
      label: 'Plantillas WhatsApp',
      shortLabel: 'Plantillas',
      icon: FileText,
      description: 'Respuestas rápidas',
    },
  ];

  const handleSelectTab = (id: TabType) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 select-none shadow-2xl lg:shadow-none ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between min-h-[65px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-blue-600 to-indigo-600 p-0.5 shrink-0 shadow-lg shadow-blue-600/30">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-xl text-white tracking-tight uppercase">
                drayo
              </span>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Navigation Content Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {/* Main Navigation Group */}
          <div>
            {!isCollapsed && (
              <h2 className="px-3 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Módulos Principales
              </h2>
            )}
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                                item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isCollapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Metrics Widget */}
          {!isCollapsed && (
            <div className="mt-auto p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  Rendimiento
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  ROAS {roas.toFixed(2)}x
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span>Ganancia Neta</span>
                  <span
                    className={`font-mono font-bold ${
                      totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    S/ {totalNetProfit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalNetProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, roas * 25))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Reset Data */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                  PC
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-slate-200 truncate">
                    Modo Escritorio
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">Full-screen OS</span>
                </div>
              </div>

              <button
                onClick={onResetData}
                title="Restablecer datos por defecto"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onResetData}
              title="Restablecer datos por defecto"
              className="w-full py-2 flex justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
