import React from 'react';
import { ShoppingBag, TrendingUp, DollarSign, MessageSquare, Plus, RefreshCw, Zap, Sparkles, Settings } from 'lucide-react';

interface HeaderProps {
  totalSalesRevenue: number;
  totalMetaAdSpend: number;
  totalNetProfit: number;
  roas: number;
  onOpenNewSaleModal: () => void;
  onOpenNewExpenseModal: () => void;
  onOpenAIAssistant: () => void;
  onOpenAISettings: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalSalesRevenue,
  totalMetaAdSpend,
  totalNetProfit,
  roas,
  onOpenNewSaleModal,
  onOpenNewExpenseModal,
  onOpenAIAssistant,
  onOpenAISettings,
  onResetData,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl tracking-tight shadow-sm shadow-blue-600/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>D'RAYO</span>
                  <span className="text-blue-700 text-xs font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    WhatsApp & Meta Ads Sync
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Centralización de Ventas, Publicidad e Inventario
              </p>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="hidden lg:flex items-center gap-6 bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ventas Totales</p>
              <p className="text-sm font-bold text-emerald-600 font-mono">S/ {totalSalesRevenue.toFixed(2)}</p>
            </div>
            <div className="w-px h-7 bg-slate-200"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meta Ads Facturado</p>
              <p className="text-sm font-bold text-blue-600 font-mono">S/ {totalMetaAdSpend.toFixed(2)}</p>
            </div>
            <div className="w-px h-7 bg-slate-200"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ROAS Meta</p>
              <p className="text-sm font-bold text-amber-600 font-mono">{roas.toFixed(2)}x</p>
            </div>
            <div className="w-px h-7 bg-slate-200"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ganancia Neta</p>
              <p className={`text-sm font-bold font-mono ${totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                S/ {totalNetProfit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-0.5 shadow-sm shadow-indigo-600/20">
              <button
                onClick={onOpenAIAssistant}
                className="flex items-center gap-2 text-white px-3 py-1.5 font-semibold text-xs sm:text-sm hover:opacity-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                <span>Asistente IA</span>
              </button>
              <button
                onClick={onOpenAISettings}
                title="Ajustes de IA & Gemini"
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer border-l border-white/20"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onOpenNewSaleModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-sm shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Registrar Venta WhatsApp</span>
            </button>

            <button
              onClick={onOpenNewExpenseModal}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Gasto Meta</span>
            </button>

            <button
              onClick={onResetData}
              title="Restablecer datos por defecto"
              className="p-2 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

