import React from 'react';
import {
  Menu,
  Sparkles,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  TrendingUp,
  DollarSign,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { TabType } from '../types';

interface TopHeaderProps {
  activeTab: TabType;
  totalSalesRevenue: number;
  totalMetaAdSpend: number;
  totalNetProfit: number;
  roas: number;
  onOpenMobileMenu: () => void;
  onOpenNewSaleModal: () => void;
  onOpenNewExpenseModal: () => void;
  onOpenAIAssistant: () => void;
  onOpenAISettings: () => void;
  onResetData: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  totalSalesRevenue,
  totalMetaAdSpend,
  totalNetProfit,
  roas,
  onOpenMobileMenu,
  onOpenNewSaleModal,
  onOpenNewExpenseModal,
  onOpenAIAssistant,
  onOpenAISettings,
  onResetData,
}) => {
  const getTabTitles = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Análisis Pro',
          subtitle: 'Métricas financieras, ROAS en tiempo real y resumen de operaciones',
        };
      case 'sales':
        return {
          title: 'Ventas WhatsApp',
          subtitle: 'Registro de pedidos por chat, estados de entrega e ingresos',
        };
      case 'meta_ads':
        return {
          title: 'Gastos Meta Ads',
          subtitle: 'Control de publicidad facturada y verificación de comprobantes PDF 2026',
        };
      case 'inventory':
        return {
          title: 'Inventario & Costos (COGS)',
          subtitle: 'Catálogo de productos, margen por unidad y alertas de stock bajo',
        };
      case 'pricing':
        return {
          title: 'Calculadora de Precios & Combos',
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

  const { title, subtitle } = getTabTitles(activeTab);

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

          {/* Center / Right Section: Live KPI Ticker & Quick Actions */}
          <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
            {/* Live KPI Ticker Pills */}
            <div className="hidden xl:flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ventas:</span>
                <span className="font-bold text-slate-900 font-mono">
                  S/ {totalSalesRevenue.toFixed(2)}
                </span>
              </div>

              <div className="w-px h-4 bg-slate-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Meta Ads:</span>
                <span className="font-bold text-blue-600 font-mono">
                  S/ {totalMetaAdSpend.toFixed(2)}
                </span>
              </div>

              <div className="w-px h-4 bg-slate-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">ROAS:</span>
                <span className="font-bold text-amber-600 font-mono">
                  {roas.toFixed(2)}x
                </span>
              </div>

              <div className="w-px h-4 bg-slate-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Neto:</span>
                <span
                  className={`font-bold font-mono ${
                    totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  S/ {totalNetProfit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAIAssistant}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm shadow-indigo-600/20 hover:opacity-95 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="hidden sm:inline">D'RAYO AI</span>
              </button>

              <button
                onClick={onOpenNewSaleModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-semibold text-xs shadow-sm shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white" />
                <span>+ Venta</span>
              </button>

              <button
                onClick={onOpenNewExpenseModal}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl font-medium text-xs transition-colors cursor-pointer hidden sm:flex"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Gasto Meta</span>
              </button>

              <button
                onClick={onOpenAISettings}
                title="Ajustes de Modelo Gemini"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
