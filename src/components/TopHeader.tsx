import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Settings,
  Cloud,
  LogOut,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { TabType } from '../types';
import { useAuth } from '../context/AuthContext';

interface TopHeaderProps {
  activeTab: TabType;
  totalSalesRevenue?: number;
  totalMetaAdSpend?: number;
  totalNetProfit?: number;
  roas?: number;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
  onOpenMobileMenu: () => void;
  onOpenNewSaleModal?: () => void;
  onOpenNewExpenseModal?: () => void;
  onOpenAIAssistant: () => void;
  onOpenAISettings: () => void;
  onOpenDatabase?: () => void;
  onResetData?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenAIAssistant,
  onOpenAISettings,
  isSyncing,
  lastSyncTime,
}) => {
  const { currentUser, username, logout, isGuestMode } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getTabTitles = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Análisis Pro',
          subtitle: 'Métricas financieras, ROAS en tiempo real y resumen de operaciones',
        };
      case 'database':
        return {
          title: 'Gestor de Base de Datos',
          subtitle: 'Motor persistente de almacenamiento en servidor, respaldos y sincronización',
        };
      case 'sales':
        return {
          title: 'Ventas WhatsApp',
          subtitle: 'Registro de pedidos por chat, estados de entrega e ingresos',
        };
      case 'meta_ads':
        return {
          title: 'Gastos Meta',
          subtitle: 'Control de publicidad facturada y verificación de comprobantes PDF 2026',
        };
      case 'inventory':
        return {
          title: 'Inventario',
          subtitle: 'Catálogo de productos, margen por unidad y alertas de stock bajo',
        };
      case 'pricing':
        return {
          title: 'Calculadora',
          subtitle: 'Calcula márgenes netos por unidad y diseña ofertas de combos para WhatsApp',
        };
      case 'meta_export':
        return {
          title: 'Conversiones Offline (Meta CAPI)',
          subtitle: 'Exportación CSV optimizada para cargar eventos de compra a Meta Ads Manager',
        };
      case 'templates':
        return {
          title: 'Plantillas de Respuesta WhatsApp',
          subtitle: 'Copia directa de mensajes rápidos para agilizar la atención al cliente',
        };
      default:
        return {
          title: "Panel Profesional D'RAYO",
          subtitle: 'Gestión Integral de Ventas y Marketing',
        };
    }
  };

  const { title } = getTabTitles(activeTab);

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left section: Mobile menu trigger + Section Breadcrumb & Titles */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
            </div>
          </div>

          {/* Right Section: AI Button, Cloud Sync Indicator, User Dropdown, Settings */}
          <div className="flex items-center gap-2.5">
            
            {/* Cloud Sync Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/90 text-[11px] font-medium text-slate-600">
              <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-blue-500 animate-pulse' : 'text-emerald-600'}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Nube Activa'}</span>
            </div>

            {/* D'RAYO AI Assistant */}
            <button
              onClick={onOpenAIAssistant}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              title="Abrir Asistente D'RAYO AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">D'RAYO AI</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenAISettings}
              title="Ajustes de IA"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile & Logout */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">{username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{username}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {currentUser?.email || (isGuestMode ? 'Modo Local / Demo' : 'Usuario conectado')}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-emerald-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Base de datos sincronizada</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};


