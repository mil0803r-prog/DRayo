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
      {/* 1. Official Meta Ads Top Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Account info & Meta Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/80">
                  Meta Ads Manager
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Cuenta Activa • Live Sync</span>
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center gap-2">
                <span>D'RAYO Ads Hub</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  (act_1334036197186369)
                </span>
              </h1>
            </div>
          </div>

          {/* Action buttons & Date Range Picker */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Range Selector Dropdown estilo Meta Ads Manager */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                title="Filtrar por rango de fechas (Meta Ads Manager)"
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">{DATE_PRESET_LABELS[datePreset]}</span>
                {datePreset === 'today' && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black tracking-tight">
                    {todayStr}
                  </span>
                )}
                {datePreset === 'custom' && customStartDate && customEndDate && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[10px] font-mono font-bold">
                    {customStartDate} ~ {customEndDate}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDatePickerOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDatePickerOpen(false)}
                  />

                  {/* Popover */}
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-3 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        Período Meta Ads
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {todayStr}
                      </span>
                    </div>

                    {/* Presets List */}
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {(
                        [
                          'today',
                          'yesterday',
                          'last_7_days',
                          'last_14_days',
                          'last_30_days',
                          'this_month',
                          'all',
                          'custom',
                        ] as MetaDatePreset[]
                      ).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            onDatePresetChange(preset);
                            if (preset !== 'custom') setIsDatePickerOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer text-xs ${
                            datePreset === preset
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{DATE_PRESET_LABELS[preset]}</span>
                          {datePreset === preset && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>

                    {/* Custom Range Picker */}
                    {datePreset === 'custom' && (
                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">
                              Desde:
                            </label>
                            <input
                              type="date"
                              value={tempStart}
                              onChange={(e) => setTempStart(e.target.value)}
                              className="w-full bg-slate-800 text-white border border-slate-700 px-2 py-1.5 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">
                              Hasta:
                            </label>
                            <input
                              type="date"
                              value={tempEnd}
                              onChange={(e) => setTempEnd(e.target.value)}
                              className="w-full bg-slate-800 text-white border border-slate-700 px-2 py-1.5 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onCustomDateChange) onCustomDateChange(tempStart, tempEnd);
                            setIsDatePickerOpen(false);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                        >
                          Actualizar Rango
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sync Button */}
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Sincronizar con Firestore Cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Exportar reporte de Meta Ads en formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {/* + Crear Anuncio Prominent Meta Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Crear Anuncio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real-time KPI Scorecard (Meta Ads Performance Matrix) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Spend */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Importe Gastado</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            S/ {totalSpend.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Inversión publicitaria</span>
        </div>

        {/* Metric 2: Results / WhatsApp Purchases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resultados (Ventas)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 flex items-center gap-1.5">
            <span>{totalSales}</span>
            <span className="text-xs font-semibold text-slate-400 font-sans">pedidos</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Conversiones por WhatsApp</span>
        </div>

        {/* Metric 3: Cost per Result / CPA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Costo por Resultado (CPA)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-700">
            S/ {averageCPA.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Gasto / Ventas WhatsApp</span>
        </div>

        {/* Metric 4: Estimated Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Valor de Conversión</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700">
            S/ {totalRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Facturación estimada</span>
        </div>

        {/* Metric 5: ROAS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">ROAS de Cuenta</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-purple-700">
            {overallROAS.toFixed(2)}x
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Retorno sobre la inversión</span>
        </div>
      </div>

      {/* 3. Meta Ads Navigation Tabs & Search */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Level Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onTabChange('ads_table')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'ads_table'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <List className="w-4 h-4 text-emerald-400" />
            <span>Tabla Administrador de Anuncios</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              {adsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('creative_hub')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'creative_hub'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span>Creative Hub (Muro Visual)</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('charts')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'charts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>Gráficos & ROAS</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID, producto o región..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 4. SECCIÓN VISIBLE DE FILTROS POR FECHA (Ventas WhatsApp & Meta Ads) */}
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
    </div>
  );
};
