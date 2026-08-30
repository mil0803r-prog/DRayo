import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  LayoutGrid,
  List,
  BarChart2,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Globe,
  Sliders,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Download,
  Search,
  Filter,
  Check,
  Zap,
  Tag
} from 'lucide-react';

export type MetaAdsTabLevel = 'ads_table' | 'creative_hub' | 'campaigns_summary' | 'charts';

export type MetaDatePreset =
  | 'today'
  | 'yesterday'
  | 'specific_date'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_30_days'
  | 'this_month'
  | 'all'
  | 'custom';

interface MetaAdsHeaderProps {
  currentTab: MetaAdsTabLevel;
  onTabChange: (tab: MetaAdsTabLevel) => void;
  datePreset: MetaDatePreset;
  onDatePresetChange: (preset: MetaDatePreset) => void;
  selectedDate?: string;
  onSelectedDateChange?: (date: string) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  todayStr: string;
  totalSpend: number;
  totalSales: number;
  averageCPA: number;
  totalRevenue: number;
  overallROAS: number;
  adsCount: number;
  isSyncing: boolean;
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
  onOpenCreateModal: () => void;
  onExportCSV: () => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
}

const DATE_PRESET_LABELS: Record<MetaDatePreset, string> = {
  today: 'Hoy (En Vivo)',
  yesterday: 'Ayer',
  specific_date: 'Fecha Específica',
  last_7_days: 'Últimos 7 días',
  last_14_days: 'Últimos 14 días',
  last_30_days: 'Últimos 30 días',
  this_month: 'Este Mes',
  all: 'Máximo / Todos',
  custom: 'Personalizado',
};

export const MetaAdsHeader: React.FC<MetaAdsHeaderProps> = ({
  currentTab,
  onTabChange,
  datePreset,
  onDatePresetChange,
  selectedDate,
  onSelectedDateChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  todayStr,
  totalSpend,
  totalSales,
  averageCPA,
  totalRevenue,
  overallROAS,
  adsCount,
  isSyncing,
  lastSyncTime,
  onManualSync,
  onOpenCreateModal,
  onExportCSV,
  searchTerm,
  onSearchChange,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempStart, setTempStart] = useState(customStartDate || todayStr);
  const [tempEnd, setTempEnd] = useState(customEndDate || todayStr);

  return (
    <div className="space-y-4">
      {/* 1. Header Bar: Actions Only */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onExportCSV}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          title="Exportar reporte en formato CSV"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Exportar</span>
        </button>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear Anuncio</span>
        </button>
      </div>

      {/* 2. KPI Scorecard (5 Clean Balanced Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Spend */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Importe Gastado</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black font-mono text-slate-900">
              S/ {totalSpend.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Inversión publicitaria</span>
          </div>
        </div>

        {/* Metric 2: Results */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resultados (Ventas)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black font-mono text-emerald-700 flex items-baseline gap-1.5">
              <span>{totalSales}</span>
              <span className="text-xs font-semibold text-slate-400 font-sans">pedidos</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Conversiones cerradas</span>
          </div>
        </div>

        {/* Metric 3: CPA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Costo x Venta (CPA)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black font-mono text-amber-700">
              S/ {averageCPA.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Gasto / Ventas WhatsApp</span>
          </div>
        </div>

        {/* Metric 4: Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Valor Conversión</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black font-mono text-indigo-700">
              S/ {totalRevenue.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Facturación generada</span>
          </div>
        </div>

        {/* Metric 5: ROAS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">ROAS Cuenta</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black font-mono text-purple-700">
              {overallROAS.toFixed(2)}x
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Retorno de inversión</span>
          </div>
        </div>
      </div>

      {/* 3. View Switcher Dropdown (Muro Visual, Tabla, Gráficos) & Search */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Dropdown de Selección de Vista */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
            {currentTab === 'creative_hub' && <LayoutGrid className="w-4 h-4 text-cyan-400" />}
            {currentTab === 'ads_table' && <List className="w-4 h-4 text-emerald-400" />}
            {currentTab === 'charts' && <BarChart2 className="w-4 h-4 text-amber-400" />}
          </div>

          <div className="relative min-w-[220px]">
            <select
              value={currentTab}
              onChange={(e) => onTabChange(e.target.value as 'creative_hub' | 'ads_table' | 'charts')}
              className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-900 font-bold text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl border border-slate-300/80 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs appearance-none cursor-pointer transition-colors"
            >
              <option value="creative_hub">🎨 Muro Visual (Creative Hub)</option>
              <option value="ads_table">📊 Tabla de Anuncios ({adsCount})</option>
              <option value="charts">📈 Gráficos & ROAS</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
            • {adsCount} anuncios registrados
          </span>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID, producto..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 4. SECCIÓN VISIBLE DE FILTROS POR FECHA (Ventas WhatsApp & Meta Ads) - Oculto en Muro Visual */}
      {currentTab !== 'creative_hub' && (
        <div className="bg-slate-100/90 p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
          {/* Barra de Controles de Fecha: Selector Específico + Presets Rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Fecha Específica Visible */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Fecha:</span>
              </label>
              <input
                type="date"
                value={selectedDate || todayStr}
                onChange={(e) => {
                  if (onSelectedDateChange) onSelectedDateChange(e.target.value);
                }}
                className="bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 text-slate-900 font-mono font-black text-xs px-2 py-0.5 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                title="Filtrar por esta fecha exacta"
              />
            </div>

            {/* Botones de Presets Rápidos */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onDatePresetChange('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                  datePreset === 'today'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black ring-2 ring-emerald-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Hoy</span>
              </button>

              <button
                type="button"
                onClick={() => onDatePresetChange('yesterday')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  datePreset === 'yesterday'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black ring-2 ring-blue-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                Ayer
              </button>

              <button
                type="button"
                onClick={() => onDatePresetChange('last_7_days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  datePreset === 'last_7_days'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black ring-2 ring-blue-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                Últimos 7 Días
              </button>

              <button
                type="button"
                onClick={() => onDatePresetChange('last_14_days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  datePreset === 'last_14_days'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black ring-2 ring-blue-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                Últimos 14 Días
              </button>

              <button
                type="button"
                onClick={() => onDatePresetChange('this_month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  datePreset === 'this_month'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black ring-2 ring-blue-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                Este Mes
              </button>

              <button
                type="button"
                onClick={() => onDatePresetChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  datePreset === 'all'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/30 font-black ring-2 ring-slate-700'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                Todo el Historial
              </button>

              <button
                type="button"
                onClick={() => onDatePresetChange('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                  datePreset === 'custom'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black ring-2 ring-indigo-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Rango Personalizado</span>
              </button>
            </div>
          </div>

          {/* Panel de Rango Personalizado (cuando está activo) */}
          {datePreset === 'custom' && (
            <div className="bg-white p-3 rounded-xl border border-indigo-200 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <span className="text-xs font-bold text-indigo-900">Rango personalizado:</span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600">Desde:</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600">Hasta:</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onCustomDateChange) onCustomDateChange(tempStart, tempEnd);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
              >
                Aplicar Rango
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
