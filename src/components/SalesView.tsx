import React, { useState, useEffect } from 'react';
import { DailySaleRecord, Product } from '../types';
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Save,
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
  ChevronUp,
  Info,
  X,
  FileText,
  AlertTriangle,
  Tag,
  Cloud,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { getStoredDailyRecords, saveStoredDailyRecords } from '../lib/storage';

interface SalesViewProps {
  products: Product[];
  dailyRecords: DailySaleRecord[];
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
  onAddDailyRecord: (record: DailySaleRecord) => void;
  onUpdateDailyRecord?: (record: DailySaleRecord) => void;
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

const PERUVIAN_DEPARTMENTS = [
  'Lima Metropolitana',
  'Lima Provincias',
  'Callao',
  'Arequipa',
  'Cusco',
  'La Libertad (Trujillo)',
  'Piura',
  'Lambayeque (Chiclayo)',
  'Junín (Huancayo)',
  'Áncash (Chimbote/Huaraz)',
  'Ica',
  'San Martín (Tarapoto)',
  'Loreto (Iquitos)',
  'Cajamarca',
  'Huánuco',
  'Ayacucho',
  'Tacna',
  'Puno',
  'Ucayali (Pucallpa)',
  'Moquegua',
  'Tumbes',
  'Amazonas',
  'Apurímac',
  'Huancavelica',
  'Madre de Dios',
  'Pasco',
  'Nacional / Varios',
  'Otro'
];

export const SalesView: React.FC<SalesViewProps> = ({
  products,
  dailyRecords,
  isSyncing = false,
  lastSyncTime,
  onManualSync,
  onAddDailyRecord,
  onUpdateDailyRecord,
  onDeleteDailyRecord,
  onDeleteBulkDailyRecords,
}) => {
  // Form visibility state (collapsible to save space on mobile)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSyncInfoOpen, setIsSyncInfoOpen] = useState<boolean>(false);

  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formMonth, setFormMonth] = useState<string>('');
  const [formPlatform, setFormPlatform] = useState<string>('Meta Ads (FB / IG)');
  const [formDepartment, setFormDepartment] = useState<string>('Lima Metropolitana');
  const [isCustomDepartment, setIsCustomDepartment] = useState<boolean>(false);
  const [customDepartmentName, setCustomDepartmentName] = useState<string>('');
  const [formAdId, setFormAdId] = useState<string>('');
  const [formProduct, setFormProduct] = useState<string>('');
  const [formSpend, setFormSpend] = useState<string>('');
  const [formSalesCount, setFormSalesCount] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [isNotesInputOpen, setIsNotesInputOpen] = useState<boolean>(false);
  const [expandedNoteRowId, setExpandedNoteRowId] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<DailySaleRecord | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editMonth, setEditMonth] = useState<string>('');
  const [editPlatform, setEditPlatform] = useState<string>('Meta Ads (FB / IG)');
  const [editDepartment, setEditDepartment] = useState<string>('Lima Metropolitana');
  const [isEditCustomDepartment, setIsEditCustomDepartment] = useState<boolean>(false);
  const [customEditDepartmentName, setCustomEditDepartmentName] = useState<string>('');
  const [editAdId, setEditAdId] = useState<string>('');
  const [editProduct, setEditProduct] = useState<string>('');
  const [isCustomProduct, setIsCustomProduct] = useState<boolean>(false);
  const [customProductName, setCustomProductName] = useState<string>('');
  const [isEditCustomProduct, setIsEditCustomProduct] = useState<boolean>(false);
  const [customEditProductName, setCustomEditProductName] = useState<string>('');
  const [editSpend, setEditSpend] = useState<string>('');
  const [editSalesCount, setEditSalesCount] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Toast / feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters state
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
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

  // Automatically update editMonth whenever editDate changes
  useEffect(() => {
    if (editDate) {
      const dateObj = new Date(editDate + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        const monthIndex = dateObj.getMonth();
        setEditMonth(MONTH_NAMES[monthIndex]);
      }
    }
  }, [editDate]);

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

  // Computed CPA for edit modal
  const editSpendNum = parseFloat(editSpend) || 0;
  const editSalesNum = parseInt(editSalesCount, 10) || 0;
  const computedEditCPA = editSalesNum > 0 ? editSpendNum / editSalesNum : 0;

  // Open Edit Modal
  const handleStartEdit = (record: DailySaleRecord) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditMonth(record.month);
    setEditPlatform(record.platform || 'Meta Ads (FB / IG)');
    setEditAdId(record.adId || '');
    
    // Department in edit
    const currentDept = record.department || 'Lima Metropolitana';
    const isStandardDept = PERUVIAN_DEPARTMENTS.includes(currentDept);
    if (isStandardDept) {
      setEditDepartment(currentDept);
      setIsEditCustomDepartment(false);
      setCustomEditDepartmentName('');
    } else {
      setEditDepartment('Otro');
      setIsEditCustomDepartment(true);
      setCustomEditDepartmentName(currentDept);
    }

    const existsInCatalog = products.some((p) => p.name === record.defaultProduct);
    if (existsInCatalog) {
      setEditProduct(record.defaultProduct);
      setIsEditCustomProduct(false);
      setCustomEditProductName('');
    } else {
      setEditProduct('');
      setIsEditCustomProduct(true);
      setCustomEditProductName(record.defaultProduct);
    }

    setEditSpend(record.dailySpend.toString());
    setEditSalesCount(record.salesCount.toString());
    setEditNotes(record.notes || '');
  };

  // Save Edited Record (Flexible: works with minimal/partial data)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const effectiveEditDate = editDate.trim() || editingRecord.date || todayStr;
    const dateObj = new Date(effectiveEditDate + 'T00:00:00');
    const calculatedMonth = !isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : 'Agosto';
    const effectiveEditMonth = editMonth || calculatedMonth;

    const finalProduct = isEditCustomProduct
      ? (customEditProductName.trim() || editingRecord.defaultProduct || (products.length > 0 ? products[0].name : 'Venta WhatsApp'))
      : (editProduct.trim() || editingRecord.defaultProduct || (products.length > 0 ? products[0].name : 'Venta WhatsApp'));

    const finalDept = isEditCustomDepartment
      ? (customEditDepartmentName.trim() || editingRecord.department || 'Lima Metropolitana')
      : (editDepartment.trim() || editingRecord.department || 'Lima Metropolitana');

    const effectiveSpend = !isNaN(editSpendNum) && editSpendNum >= 0 ? editSpendNum : 0;
    const rawSales = parseInt(editSalesCount, 10);
    const effectiveSales = !isNaN(rawSales) && rawSales >= 0 ? rawSales : (editingRecord.salesCount || 1);
    const calculatedCPA = effectiveSales > 0 ? effectiveSpend / effectiveSales : 0;

    const updated: DailySaleRecord = {
      ...editingRecord,
      date: effectiveEditDate,
      month: effectiveEditMonth,
      platform: editPlatform || editingRecord.platform || 'Meta Ads (FB / IG)',
      department: finalDept,
      adId: editAdId.trim() || undefined,
      defaultProduct: finalProduct,
      dailySpend: effectiveSpend,
      salesCount: effectiveSales,
      cpa: parseFloat(calculatedCPA.toFixed(2)),
      notes: editNotes.trim() || undefined,
    };

    if (onUpdateDailyRecord) {
      onUpdateDailyRecord(updated);
    } else {
      // Fallback local update
      const stored = getStoredDailyRecords();
      const updatedList = stored.map((r) => (r.id === updated.id ? updated : r));
      saveStoredDailyRecords(updatedList);
    }

    setEditingRecord(null);
    setSuccessMsg('¡Registro de venta y métricas de Ads actualizados con éxito!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Handle Form Submission (Flexible: allows saving even with just 1 datum or partial data)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveDate = formDate.trim() || todayStr;
    const dateObj = new Date(effectiveDate + 'T00:00:00');
    const calculatedMonth = !isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : 'Agosto';
    const effectiveMonth = formMonth || calculatedMonth;
    const effectivePlatform = formPlatform.trim() || 'Meta Ads (FB / IG)';

    // Product fallback: custom name, selected product, first catalog item, or generic
    const finalProduct = isCustomProduct
      ? (customProductName.trim() || (products.length > 0 ? products[0].name : 'Venta WhatsApp'))
      : (formProduct.trim() || (products.length > 0 ? products[0].name : 'Venta WhatsApp'));

    // Department fallback
    const finalDept = isCustomDepartment
      ? (customDepartmentName.trim() || 'Lima Metropolitana')
      : (formDepartment.trim() || 'Lima Metropolitana');

    // Spend fallback: 0 if empty
    const effectiveSpend = !isNaN(currentSpendNum) && currentSpendNum >= 0 ? currentSpendNum : 0;

    // Sales count fallback: if provided use it, otherwise default to 1
    const rawSales = parseInt(formSalesCount, 10);
    const effectiveSales = !isNaN(rawSales) && rawSales >= 0 ? rawSales : 1;

    // CPA calculation
    const calculatedCPA = effectiveSales > 0 ? effectiveSpend / effectiveSales : 0;

    const newRecord: DailySaleRecord = {
      id: `REC-${Date.now()}`,
      adId: formAdId.trim() || undefined,
      date: effectiveDate,
      month: effectiveMonth,
      platform: effectivePlatform,
      department: finalDept,
      defaultProduct: finalProduct,
      dailySpend: effectiveSpend,
      salesCount: effectiveSales,
      cpa: parseFloat(calculatedCPA.toFixed(2)),
      notes: formNotes.trim() || undefined,
    };

    onAddDailyRecord(newRecord);
    
    // Reset inputs
    setFormSpend('');
    setFormSalesCount('');
    setFormAdId('');
    setFormNotes('');
    setCustomProductName('');
    setIsCustomProduct(false);
    setCustomDepartmentName('');
    setIsCustomDepartment(false);
    setIsNotesInputOpen(false);
    setIsFormOpen(false);

    setSuccessMsg('¡Venta registrada con éxito con los datos ingresados!');
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
      ? `Fecha: ${rec.date} ${rec.adId ? `| ID Anuncio: ${rec.adId}` : ''} | Producto: ${rec.defaultProduct} | Ventas: ${rec.salesCount} (Gasto: S/ ${rec.dailySpend.toFixed(2)})`
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
    const matchesDepartment = filterDepartment === 'all' || (rec.department || 'Lima Metropolitana') === filterDepartment;
    const matchesProduct = filterProduct === 'all' || rec.defaultProduct === filterProduct;
    const matchesSearch =
      rec.defaultProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.platform || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.adId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.date.includes(searchTerm) ||
      rec.month.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMonth && matchesPlatform && matchesDepartment && matchesProduct && matchesSearch;
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
    const headers = ['ID', 'Fecha', 'Mes', 'Tipo Plataforma', 'Departamento', 'ID Anuncio', 'Producto Por Defecto', 'Gasto Diario (S/)', 'Numero Ventas', 'CPA (S/)', 'Notas'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.date,
      r.month,
      `"${(r.platform || 'Meta Ads (FB / IG)').replace(/"/g, '""')}"`,
      `"${(r.department || 'Lima Metropolitana').replace(/"/g, '""')}"`,
      `"${(r.adId || '').replace(/"/g, '""')}"`,
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

      {/* Cloud Multi-Device Live Sync Status Bar (Collapsible / Compact) */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-emerald-50/80 border border-blue-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-white text-blue-600 border border-blue-200 shadow-2xs shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-slate-900">
                Sincronización en la Nube Activa
              </span>
              {lastSyncTime && (
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  • Sinc: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Toggle Info / Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsSyncInfoOpen(!isSyncInfoOpen)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-blue-700 hover:text-blue-800 text-[11px] font-semibold border border-blue-200/80 transition-colors cursor-pointer"
              title={isSyncInfoOpen ? 'Ocultar detalles' : 'Ver cómo funciona la sincronización'}
            >
              <Info className="w-3 h-3 text-blue-600" />
              <span>{isSyncInfoOpen ? 'Menos info' : '¿Cómo funciona?'}</span>
              {isSyncInfoOpen ? (
                <ChevronUp className="w-3 h-3 text-blue-600" />
              ) : (
                <ChevronDown className="w-3 h-3 text-blue-600" />
              )}
            </button>
          </div>

          {onManualSync && (
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-2xs shrink-0 ${
                isSyncing
                  ? 'bg-blue-600 text-white border-blue-600 cursor-wait'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-white' : 'text-blue-600'}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
            </button>
          )}
        </div>

        {/* Expandable Explanation Details */}
        {isSyncInfoOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-blue-200/70 text-[11px] text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
            <p>
              Cada venta registrada en WhatsApp se guarda automáticamente en el servidor central y se sincroniza en tiempo real entre tu laptop, teléfono móvil o cualquier otro dispositivo al ingresar al enlace.
            </p>
          </div>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gasto Diario Total</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            style={{ fontSize: '25px', color: '#19172b' }}
            className="font-black font-mono leading-tight tracking-tight"
          >
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
          <div
            style={{ fontSize: '25px', color: '#19172b' }}
            className="font-black font-mono leading-tight tracking-tight"
          >
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
          <div
            style={{ fontSize: '25px', color: '#19172b' }}
            className="font-black font-mono leading-tight tracking-tight"
          >
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
          <div
            style={{ fontSize: '25px', color: '#19172b' }}
            className="font-black font-mono leading-tight tracking-tight"
          >
            {filteredRecords.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Días/Estrategias registradas</p>
        </div>
      </div>

      {/* Simple Toggle Button */}
      <div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`w-full font-bold py-3.5 px-5 rounded-xl shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base border active:scale-98 ${
            isFormOpen
              ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-blue-600/20'
          }`}
        >
          {isFormOpen ? (
            <>
              <X className="w-5 h-5" />
              <span>Cerrar Registro</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Registrar Venta</span>
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
                  ⚡ Registro flexible: Guarda con 1 solo dato o los que tengas a la mano. Los demás se autocompletarán.
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

          {/* Flexible Registration Notice */}
          <div className="bg-blue-50/80 border-b border-blue-100 px-5 py-2.5 flex items-center gap-2 text-xs text-blue-800">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Modo Rápido:</strong> Puedes registrar solo el producto, solo el gasto, solo las ventas o solo el ID de anuncio. Los campos vacíos se asignan con valores por defecto.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Fecha</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {PLATFORM_OPTIONS.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Departamento / Región */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>4. Departamento</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDepartment(!isCustomDepartment);
                      if (!isCustomDepartment) {
                        setCustomDepartmentName('');
                      }
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {isCustomDepartment ? '📋 Lista' : '✏️ Otro'}
                  </button>
                </div>

                {!isCustomDepartment ? (
                  <select
                    value={formDepartment}
                    onChange={(e) => {
                      if (e.target.value === 'Otro') {
                        setIsCustomDepartment(true);
                        setCustomDepartmentName('');
                      } else {
                        setFormDepartment(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    {PERUVIAN_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Ej. Arequipa, Trujillo..."
                      value={customDepartmentName}
                      onChange={(e) => setCustomDepartmentName(e.target.value)}
                      className="flex-1 bg-white border border-rose-300 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomDepartment(false)}
                      className="px-2.5 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                    >
                      Lista
                    </button>
                  </div>
                )}
              </div>

              {/* 5. ID de Anuncio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-cyan-600" />
                  <span>5. ID Anuncio</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. 238541298..."
                  value={formAdId}
                  onChange={(e) => setFormAdId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* 6. Producto por defecto */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    <span>6. Producto</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomProduct(!isCustomProduct);
                      if (!isCustomProduct) {
                        setCustomProductName('');
                      }
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {isCustomProduct ? '📦 Catálogo' : '➕ Manual'}
                  </button>
                </div>

                <div className="space-y-1">
                  {!isCustomProduct ? (
                    <>
                      <select
                        value={formProduct}
                        onChange={(e) => {
                          if (e.target.value === '__manual__') {
                            setIsCustomProduct(true);
                            setCustomProductName('');
                          } else {
                            setFormProduct(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer truncate"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} (Stock: {p.stock})
                          </option>
                        ))}
                        <option value="__manual__">➕ Escribir manualmente...</option>
                      </select>
                    </>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Nombre de producto..."
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        className="flex-1 bg-white border border-blue-300 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-600 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomProduct(false);
                          setCustomProductName('');
                        }}
                        className="px-2.5 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                      >
                        Catálogo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Gasto diario */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>7. Gasto Diario (S/)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formSpend}
                  onChange={(e) => setFormSpend(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* 8. Número de ventas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>8. N° de Ventas</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="1"
                  value={formSalesCount}
                  onChange={(e) => setFormSalesCount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

            </div>

            {/* Row 2: Live CPA Indicator & Submit button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-100">
              
              {/* Live CPA Calculated Display */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  9. CPA Calculado:
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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

            {/* Department Filter */}
            <div className="relative w-full sm:w-48">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer truncate"
              >
                <option value="all">Todos los Departamentos</option>
                {PERUVIAN_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
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
                <th className="py-3.5 px-4">Departamento</th>
                <th className="py-3.5 px-4">ID Anuncio</th>
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

                    {/* Departamento */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                        <span className="truncate max-w-[130px]" title={rec.department || 'Lima Metropolitana'}>
                          {rec.department || 'Lima Metropolitana'}
                        </span>
                      </span>
                    </td>

                    {/* ID Anuncio */}
                    <td className="py-3.5 px-4">
                      {rec.adId ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span className="truncate max-w-[130px]" title={rec.adId}>{rec.adId}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">-</span>
                      )}
                    </td>

                    {/* Producto por defecto */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {rec.defaultProduct}
                    </td>

                    {/* Gasto Diario */}
                    <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-blue-600">
                      S/ {rec.dailySpend.toFixed(2)}
                    </td>

                    {/* Número de Ventas */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1 rounded-full font-black font-mono text-sm inline-block shadow-2xs">
                        {rec.salesCount}
                      </span>
                    </td>

                    {/* CPA */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black font-mono text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(rec)}
                          title="Editar registro de venta y Ads"
                          className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteSingle(rec.id)}
                          title="Eliminar registro de venta"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
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

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Edit2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Editar Registro de Venta & Ads
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {editingRecord.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Fecha */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fecha</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  />
                </div>

                {/* 2. Mes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mes Asignado
                  </label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Plataforma */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    <span>Plataforma</span>
                  </label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    {PLATFORM_OPTIONS.map((plat) => (
                      <option key={plat} value={plat}>
                        {plat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Departamento */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>Departamento</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditCustomDepartment(!isEditCustomDepartment);
                        if (!isEditCustomDepartment) {
                          setCustomEditDepartmentName(editDepartment || '');
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {isEditCustomDepartment ? '📋 Lista' : '✏️ Otro'}
                    </button>
                  </div>

                  {!isEditCustomDepartment ? (
                    <select
                      value={editDepartment}
                      onChange={(e) => {
                        if (e.target.value === 'Otro') {
                          setIsEditCustomDepartment(true);
                          setCustomEditDepartmentName('');
                        } else {
                          setEditDepartment(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                    >
                      {PERUVIAN_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Escribe departamento..."
                        value={customEditDepartmentName}
                        onChange={(e) => setCustomEditDepartmentName(e.target.value)}
                        className="flex-1 bg-white border border-rose-300 text-slate-900 px-2.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditCustomDepartment(false)}
                        className="px-2 py-1 text-[10px] bg-slate-200 text-slate-700 rounded-lg font-bold"
                      >
                        Lista
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. ID Anuncio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-cyan-600" />
                    <span>ID Anuncio</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 238541298..."
                    value={editAdId}
                    onChange={(e) => setEditAdId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* 6. Producto */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Producto Vinculado</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditCustomProduct(!isEditCustomProduct);
                        if (!isEditCustomProduct) {
                          setCustomEditProductName(editProduct || '');
                        }
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {isEditCustomProduct ? '📦 Seleccionar del inventario' : '➕ Agregar manualmente'}
                    </button>
                  </div>

                  {!isEditCustomProduct ? (
                    <select
                      value={editProduct}
                      onChange={(e) => {
                        if (e.target.value === '__manual__') {
                          setIsEditCustomProduct(true);
                          setCustomEditProductName('');
                        } else {
                          setEditProduct(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} — Stock actual: {p.stock} und. (S/ {p.salePrice.toFixed(2)})
                        </option>
                      ))}
                      <option value="__manual__">➕ Escribir / Agregar producto manualmente...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escribe el nombre del producto (opcional)..."
                        value={customEditProductName}
                        onChange={(e) => setCustomEditProductName(e.target.value)}
                        className="flex-1 bg-white border border-blue-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditCustomProduct(false);
                        }}
                        className="px-2.5 py-1.5 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer"
                      >
                        Catálogo
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Gasto Diario */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gasto Diario (S/)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editSpend}
                    onChange={(e) => setEditSpend(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* 7. N° de Ventas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>N° de Ventas</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1"
                    value={editSalesCount}
                    onChange={(e) => setEditSalesCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

              </div>

              {/* Live CPA indicator */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block uppercase">
                    CPA Recalculado en Vivo:
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    S/ {editSpendNum.toFixed(2)} / {editSalesNum || 1} ventas
                  </span>
                </div>
                <span className="text-lg font-black font-mono text-emerald-600">
                  S/ {computedEditCPA.toFixed(2)}
                </span>
              </div>

              {/* 8. Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Notas u Observaciones</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de la campaña o detalles del pedido..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

