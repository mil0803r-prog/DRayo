import React, { useState, useEffect } from 'react';
import { DailySaleRecord, Product } from '../types';
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Plus,
  Trash2,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Sparkles,
  Zap,
  BarChart2,
  Share2,
  Globe,
  ChevronDown,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { getStoredDailyRecords, saveStoredDailyRecords } from '../lib/storage';

interface SalesViewProps {
  products: Product[];
  dailyRecords: DailySaleRecord[];
  onAddDailyRecord: (record: DailySaleRecord) => void;
  onDeleteDailyRecord: (id: string) => void;
  onDeleteBulkDailyRecords: (ids: string[]) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_COLORS: Record<string, string> = {
  'Enero': 'bg-sky-50 text-sky-700 border-sky-200',
  'Febrero': 'bg-rose-50 text-rose-700 border-rose-200',
  'Marzo': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Abril': 'bg-amber-50 text-amber-800 border-amber-200',
  'Mayo': 'bg-violet-50 text-violet-700 border-violet-200',
  'Junio': 'bg-teal-50 text-teal-700 border-teal-200',
  'Julio': 'bg-red-50 text-red-700 border-red-200',
  'Agosto': 'bg-blue-50 text-blue-700 border-blue-200',
  'Septiembre': 'bg-orange-50 text-orange-700 border-orange-200',
  'Octubre': 'bg-purple-50 text-purple-700 border-purple-200',
  'Noviembre': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Diciembre': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
};

const getMonthBadgeClass = (month: string) => {
  return MONTH_COLORS[month] || 'bg-slate-50 text-slate-700 border-slate-200';
};

const PLATFORM_OPTIONS = [
  'Meta Ads (FB / IG)',
  'TikTok Ads',
  'Google Ads',
  'Orgánico / Directo',
  'WhatsApp Business',
  'Otro'
];

export const SalesView: React.FC<SalesViewProps> = ({
  products,
  dailyRecords,
  onAddDailyRecord,
  onDeleteDailyRecord,
  onDeleteBulkDailyRecords,
}) => {
  // Form visibility state (collapsible to save space on mobile)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formMonth, setFormMonth] = useState<string>('');
  const [formPlatform, setFormPlatform] = useState<string>('Meta Ads (FB / IG)');
  const [formProduct, setFormProduct] = useState<string>('');
  const [formSpend, setFormSpend] = useState<string>('');
  const [formSalesCount, setFormSalesCount] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [isNotesInputOpen, setIsNotesInputOpen] = useState<boolean>(false);
  const [expandedNoteRowId, setExpandedNoteRowId] = useState<string | null>(null);

  // Toast / feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters state
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Automatically update 'Mes' whenever 'Fecha' changes
  useEffect(() => {
    if (formDate) {
      const dateObj = new Date(formDate + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        const monthIndex = dateObj.getMonth();
        setFormMonth(MONTH_NAMES[monthIndex]);
      }
    }
  }, [formDate]);

  // Set default product from catalog if available
  useEffect(() => {
    if (products.length > 0 && !formProduct) {
      setFormProduct(products[0].name);
    }
  }, [products]);

  // Computed CPA in real-time for current form inputs
  const currentSpendNum = parseFloat(formSpend) || 0;
  const currentSalesNum = parseInt(formSalesCount, 10) || 0;
  const computedCPA = currentSalesNum > 0 ? currentSpendNum / currentSalesNum : 0;

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDate) {
      alert('Por favor selecciona la fecha');
      return;
    }

    if (!formProduct) {
      alert('Por favor ingresa o selecciona un producto por defecto');
      return;
    }

    if (currentSpendNum < 0 || isNaN(currentSpendNum)) {
      alert('Por favor ingresa un gasto diario válido');
      return;
    }

    if (currentSalesNum < 1 || isNaN(currentSalesNum)) {
      alert('Por favor ingresa un número de ventas válido (al menos 1)');
      return;
    }

    const newRecord: DailySaleRecord = {
      id: `REC-${Date.now()}`,
      date: formDate,
      month: formMonth || 'Agosto',
      platform: formPlatform,
      defaultProduct: formProduct,
      dailySpend: currentSpendNum,
      salesCount: currentSalesNum,
      cpa: parseFloat(computedCPA.toFixed(2)),
      notes: formNotes,
    };

    onAddDailyRecord(newRecord);
    
    // Reset inputs
    setFormSpend('');
    setFormSalesCount('');
    setFormNotes('');
    setIsNotesInputOpen(false);
    setIsFormOpen(false);

    setSuccessMsg('¡Registro de ventas guardado y stock descontado del inventario!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    mode: 'single' | 'bulk';
    recordId?: string;
    recordSummary?: string;
    count?: number;
  }>({
    isOpen: false,
    mode: 'single',
  });

  // Request single delete with confirmation alert
  const requestDeleteSingle = (id: string) => {
    const rec = dailyRecords.find((r) => r.id === id);
    const summary = rec
      ? `Fecha: ${rec.date} | Producto: ${rec.defaultProduct} | Ventas: ${rec.salesCount} (Gasto: S/ ${rec.dailySpend.toFixed(2)})`
      : `ID: ${id}`;

    setDeleteModal({
      isOpen: true,
      mode: 'single',
      recordId: id,
      recordSummary: summary,
    });
  };

  // Request bulk delete for filtered records with confirmation alert
  const requestDeleteBulk = () => {
    if (filteredRecords.length === 0) return;
    setDeleteModal({
      isOpen: true,
      mode: 'bulk',
      count: filteredRecords.length,
    });
  };

  // Execute deletion after alert confirmation
  const confirmDeletion = () => {
    if (deleteModal.mode === 'single' && deleteModal.recordId) {
      onDeleteDailyRecord(deleteModal.recordId);
      setSuccessMsg('¡Registro de venta eliminado y stock restaurado!');
    } else if (deleteModal.mode === 'bulk') {
      const filteredIds = filteredRecords.map((r) => r.id);
      onDeleteBulkDailyRecords(filteredIds);
      setSuccessMsg(`¡${deleteModal.count || 0} registro(s) eliminado(s) y stock devuelto al inventario!`);
    }

    setDeleteModal({ isOpen: false, mode: 'single' });
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Unique product names for filter
  const uniqueProductNames = Array.from(
    new Set([
      ...products.map((p) => p.name),
      ...dailyRecords.map((r) => r.defaultProduct).filter(Boolean)
    ])
  );

  // Filtered records logic
  const filteredRecords = dailyRecords.filter((rec) => {
    const matchesMonth = filterMonth === 'all' || rec.month === filterMonth;
    const matchesPlatform = filterPlatform === 'all' || (rec.platform || 'Meta Ads (FB / IG)') === filterPlatform;
    const matchesProduct = filterProduct === 'all' || rec.defaultProduct === filterProduct;
    const matchesSearch =
      rec.defaultProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.platform || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.date.includes(searchTerm) ||
      rec.month.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMonth && matchesPlatform && matchesProduct && matchesSearch;
  });

  // Calculate totals
  const totalSpend = filteredRecords.reduce((sum, r) => sum + r.dailySpend, 0);
  const totalSales = filteredRecords.reduce((sum, r) => sum + r.salesCount, 0);
  const averageCPA = totalSales > 0 ? totalSpend / totalSales : 0;

  // Helper for platform badge color
  const getPlatformBadge = (platform?: string) => {
    const p = platform || 'Meta Ads (FB / IG)';
    if (p.includes('Meta')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (p.includes('TikTok')) {
      return 'bg-slate-900 text-cyan-300 border-slate-700';
    } else if (p.includes('Google')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (p.includes('Orgánico')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (p.includes('WhatsApp')) {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Mes', 'Tipo Plataforma', 'Producto Por Defecto', 'Gasto Diario (S/)', 'Numero Ventas', 'CPA (S/)', 'Notas'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.date,
      r.month,
      `"${(r.platform || 'Meta Ads (FB / IG)').replace(/"/g, '""')}"`,
      `"${r.defaultProduct.replace(/"/g, '""')}"`,
      r.dailySpend.toFixed(2),
      r.salesCount,
      r.cpa.toFixed(2),
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DRAYO_Ventas_WhatsApp_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast alert */}
      {successMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gasto Diario Total</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            S/ {totalSpend.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Inversión acumulada en anuncios</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total N° de Ventas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalSales}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pedidos cerrados por WhatsApp</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">CPA Promedio</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            S/ {averageCPA.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Costo por adquisición por cliente</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registros Activos</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {filteredRecords.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Días/Estrategias registradas</p>
        </div>
      </div>

      {/* Big Mobile-friendly Toggle Button */}
      <div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 text-sm sm:text-base active:scale-98 transition-all cursor-pointer border border-blue-500/30"
        >
          {isFormOpen ? (
            <>
              <X className="w-5 h-5 stroke-[2.5]" />
              <span>Ocultar Formulario de Registro</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>+ Registrar Datos de Venta Diaria</span>
              <ChevronDown className="w-5 h-5 ml-1 opacity-80" />
            </>
          )}
        </button>
      </div>

      {/* Main Form Registration Panel (Collapsed by default on mobile to save space) */}
      {isFormOpen && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">Panel de Registro de Ventas WhatsApp</h2>
                <p className="text-xs text-slate-400">
                  Ingresa los datos del día: Fecha, Mes, Plataforma, Producto, Gasto Diario, N° Ventas y CPA
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              
              {/* 1. Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Fecha</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* 2. Mes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Mes</span>
                </label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Tipo de Plataforma */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                  <span>3. Plataforma</span>
                </label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {PLATFORM_OPTIONS.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Producto por defecto */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>4. Producto Vinculado al Inventario</span>
                </label>
                <div className="space-y-1">
                  <select
                    value={formProduct}
                    onChange={(e) => setFormProduct(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} — Stock: {p.stock} und. (S/ {p.salePrice.toFixed(2)})
                      </option>
                    ))}
                    <option value="Producto Personalizado">-- Otro Producto Personalizado --</option>
                  </select>
                  {products.find((p) => p.name === formProduct) && (
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                      <Zap className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>
                        Stock actual: <strong>{products.find((p) => p.name === formProduct)?.stock} und.</strong> (Se descontarán automáticamente al guardar)
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Gasto diario */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>5. Gasto Diario (S/)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej. 50.00"
                  required
                  value={formSpend}
                  onChange={(e) => setFormSpend(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* 6. Número de ventas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>6. N° de Ventas</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 5"
                  required
                  value={formSalesCount}
                  onChange={(e) => setFormSalesCount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

            </div>

            {/* Row 2: Live CPA Indicator & Submit button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-100">
              
              {/* Live CPA Calculated Display */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  7. CPA Calculado:
                </span>
                <span className="text-base font-black font-mono text-emerald-600">
                  S/ {computedCPA.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400">
                  (Gasto S/ {currentSpendNum.toFixed(2)} / {currentSalesNum || 1} ventas)
                </span>
              </div>

              {/* Optional Notes (Expandable to the right) & Submit */}
              <div className="flex items-center gap-3 flex-wrap">
                {isNotesInputOpen || formNotes ? (
                  <div className="flex items-center gap-2 bg-slate-50 border border-blue-300 p-1 pl-3 rounded-xl shadow-xs transition-all animate-in fade-in slide-in-from-left-2 duration-200">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      placeholder="Notas u observaciones..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      autoFocus
                      className="w-44 sm:w-64 bg-transparent border-none text-slate-900 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotesInputOpen(false);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                      title="Ocultar nota"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsNotesInputOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Nota</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 text-xs sm:text-sm flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Registrar Datos</span>
                </button>
              </div>

            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        
        {/* Month Pills with Distinct Colors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Meses:
          </span>
          <button
            onClick={() => setFilterMonth('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterMonth === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
            }`}
          >
            Todos los Meses
          </button>
          {MONTH_NAMES.map((m) => {
            const isSelected = filterMonth === m;
            const colorStyle = getMonthBadgeClass(m);
            return (
              <button
                key={m}
                onClick={() => setFilterMonth(isSelected ? 'all' : m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${colorStyle} ${
                  isSelected ? 'ring-2 ring-slate-900 ring-offset-1 shadow-xs scale-105 font-black' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            {/* Month Filter Dropdown */}
            <div className="relative w-full sm:w-44">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">Todos los Meses</option>
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Filter */}
            <div className="relative w-full sm:w-44">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">Todas las Plataformas</option>
                {PLATFORM_OPTIONS.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Filter */}
            <div className="relative w-full sm:w-52">
              <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer truncate"
              >
                <option value="all">Todos los Productos</option>
                {uniqueProductNames.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por producto o fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {filteredRecords.length > 0 && (
              <button
                type="button"
                onClick={requestDeleteBulk}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3.5 py-2 rounded-xl text-xs border border-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                title="Eliminar todos los registros actualmente filtrados con alerta de confirmación"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Eliminar Filtrados ({filteredRecords.length})</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exportar a CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table of WhatsApp Daily Sales Records */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Mes</th>
                <th className="py-3.5 px-4">Plataforma</th>
                <th className="py-3.5 px-4">Producto Por Defecto</th>
                <th className="py-3.5 px-4 text-right">Gasto Diario</th>
                <th className="py-3.5 px-4 text-center">N° de Ventas</th>
                <th className="py-3.5 px-4 text-right">CPA Calculado</th>
                <th className="py-3.5 px-4 text-center">Notas</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Fecha */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {rec.date}
                    </td>

                    {/* Mes */}
                    <td className="py-3.5 px-4">
                      <span className={`border px-2.5 py-0.5 rounded-md font-bold text-[11px] inline-block ${getMonthBadgeClass(rec.month)}`}>
                        {rec.month}
                      </span>
                    </td>

                    {/* Plataforma */}
                    <td className="py-3.5 px-4">
                      <span className={`border px-2.5 py-0.5 rounded-md font-bold text-[11px] inline-block ${getPlatformBadge(rec.platform)}`}>
                        {rec.platform || 'Meta Ads (FB / IG)'}
                      </span>
                    </td>

                    {/* Producto por defecto */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {rec.defaultProduct}
                    </td>

                    {/* Gasto Diario */}
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-blue-600">
                      S/ {rec.dailySpend.toFixed(2)}
                    </td>

                    {/* Número de Ventas */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-black font-mono">
                        {rec.salesCount}
                      </span>
                    </td>

                    {/* CPA */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        S/ {rec.cpa.toFixed(2)}
                      </span>
                    </td>

                    {/* Notas (Desplegable para la derecha) */}
                    <td className="py-3.5 px-4 text-center">
                      {rec.notes ? (
                        expandedNoteRowId === rec.id ? (
                          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-xl text-xs font-medium transition-all animate-in fade-in slide-in-from-left-2 duration-200 shadow-xs max-w-xs text-left">
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="flex-1 break-words">{rec.notes}</span>
                            <button
                              onClick={() => setExpandedNoteRowId(null)}
                              className="p-0.5 hover:bg-amber-200/60 rounded text-amber-800 transition-colors shrink-0 ml-1"
                              title="Plegar nota"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setExpandedNoteRowId(rec.id)}
                            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                            title="Haz clic para desplegar nota a la derecha"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>Ver nota</span>
                          </button>
                        )
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => requestDeleteSingle(rec.id)}
                        title="Eliminar registro de venta"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No hay registros de ventas guardados con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Alert Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  ⚠️ Confirmar Eliminación
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {deleteModal.mode === 'single'
                    ? '¿Estás seguro de que deseas eliminar este registro de venta por WhatsApp?'
                    : `¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE los ${deleteModal.count} registros de ventas por WhatsApp actualmente filtrados?`}
                </p>
              </div>
            </div>

            {deleteModal.mode === 'single' && deleteModal.recordSummary && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-mono text-slate-700 break-words">
                {deleteModal.recordSummary}
              </div>
            )}

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-[11px] font-semibold text-rose-800 flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Esta acción es irreversible y borrará los datos del historial.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, mode: 'single' })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletion}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Datos</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

