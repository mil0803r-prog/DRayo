import React, { useState } from 'react';
import { DailySaleRecord, Product } from '../../types';
import {
  generateMetaAdId,
  getDefaultAdIdForProduct,
  saveProductAdPreset
} from '../../lib/adUtils';
import {
  Calendar,
  Maximize2,
  Edit2,
  Trash2,
  Copy,
  Check,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  MapPin,
  Tag,
  Zap,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MetaAdsTableProps {
  records: DailySaleRecord[];
  allDailyRecords?: DailySaleRecord[];
  products: Product[];
  todayStr: string;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onAddRecord?: (record: DailySaleRecord) => void;
  onUpdateRecord: (record: DailySaleRecord) => void;
  onStartEdit: (record: DailySaleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onViewImage: (imageUrl: string, record: DailySaleRecord) => void;
  onDuplicateForToday?: (record: DailySaleRecord) => void;
}

export const MetaAdsTable: React.FC<MetaAdsTableProps> = ({
  records,
  allDailyRecords,
  products,
  todayStr,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onAddRecord,
  onUpdateRecord,
  onStartEdit,
  onDeleteRecord,
  onViewImage,
  onDuplicateForToday,
}) => {
  const [editingSpendId, setEditingSpendId] = useState<string | null>(null);
  const [spendInput, setSpendInput] = useState<string>('');
  const [editingSalesId, setEditingSalesId] = useState<string | null>(null);
  const [salesInput, setSalesInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Expanded breakdown for ad rows to see history by date
  const [expandedAdKeys, setExpandedAdKeys] = useState<string[]>([]);

  // Quick Daily Log Modal state
  const [quickLogRecord, setQuickLogRecord] = useState<DailySaleRecord | null>(null);
  const [quickLogDate, setQuickLogDate] = useState<string>(todayStr);
  const [quickLogSpend, setQuickLogSpend] = useState<string>('30');
  const [quickLogSales, setQuickLogSales] = useState<string>('0');
  const [quickLogNotes, setQuickLogNotes] = useState<string>('');

  const effectiveAllRecords = allDailyRecords || records;

  // Toggle expand ad history
  const toggleExpandAd = (key: string) => {
    if (expandedAdKeys.includes(key)) {
      setExpandedAdKeys(expandedAdKeys.filter((k) => k !== key));
    } else {
      setExpandedAdKeys([...expandedAdKeys, key]);
    }
  };

  // Notification state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    subtext?: string;
    type?: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (text: string, subtext?: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, subtext, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 2500);
  };

  // Quick increment/decrement sales with safe confirmation feedback
  const handleDeltaSales = (record: DailySaleRecord, delta: number) => {
    const newCount = Math.max(0, (record.salesCount || 0) + delta);
    const calculatedCPA = newCount > 0 ? record.dailySpend / newCount : 0;
    const updated: DailySaleRecord = {
      ...record,
      salesCount: newCount,
      cpa: parseFloat(calculatedCPA.toFixed(2)),
    };
    onUpdateRecord(updated);

    if (delta < 0) {
      showToast(
        `-1 Venta (${newCount} total)`,
        `${record.defaultProduct} • CPA: S/ ${calculatedCPA.toFixed(2)}`,
        'warning'
      );
    }
  };

  const handleSaveSales = (record: DailySaleRecord) => {
    const parsed = parseInt(salesInput, 10);
    const newSales = !isNaN(parsed) && parsed >= 0 ? parsed : record.salesCount;
    const calculatedCPA = newSales > 0 ? record.dailySpend / newSales : 0;
    const updated: DailySaleRecord = {
      ...record,
      salesCount: newSales,
      cpa: parseFloat(calculatedCPA.toFixed(2)),
    };
    onUpdateRecord(updated);
    setEditingSalesId(null);
  };

  const handleSaveSpend = (record: DailySaleRecord) => {
    const parsed = parseFloat(spendInput);
    const newSpend = !isNaN(parsed) && parsed >= 0 ? parsed : record.dailySpend;
    const calculatedCPA = record.salesCount > 0 ? newSpend / record.salesCount : 0;
    const updated: DailySaleRecord = {
      ...record,
      dailySpend: parseFloat(newSpend.toFixed(2)),
      cpa: parseFloat(calculatedCPA.toFixed(2)),
    };
    onUpdateRecord(updated);
    setEditingSpendId(null);
    showToast(
      `Gasto actualizado a S/ ${newSpend.toFixed(2)}`,
      `${record.defaultProduct} (${record.date}) - CPA: S/ ${calculatedCPA.toFixed(2)}`
    );
  };

  const handleCopyAdId = (adId: string) => {
    navigator.clipboard.writeText(adId);
    setCopiedId(adId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for product lookup with smart fallback
  const getProductInfo = (productName: string) => {
    if (!productName) return products.find((p) => p.imageUrl) || products[0];
    const clean = productName.trim().toLowerCase();
    return (
      products.find((p) => p.name.trim().toLowerCase() === clean) ||
      products.find((p) => clean.length >= 3 && (p.name.toLowerCase().includes(clean) || clean.includes(p.name.toLowerCase()))) ||
      products.find((p) => p.imageUrl) ||
      products[0]
    );
  };

  // Get date key / group key for an ad
  const getAdKey = (rec: DailySaleRecord) => {
    if (rec.adId && rec.adId.trim()) return `ad_${rec.adId.trim()}`;
    return `prod_${rec.defaultProduct.trim().toLowerCase()}`;
  };

  // Get all history dates for a given ad across all records
  const getAdHistoryDates = (rec: DailySaleRecord) => {
    const key = getAdKey(rec);
    return effectiveAllRecords
      .filter((r) => getAdKey(r) === key)
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  // Open Quick Daily Log modal for this ad
  const handleOpenQuickLog = (rec: DailySaleRecord, targetDate = todayStr) => {
    setQuickLogRecord(rec);
    setQuickLogDate(targetDate);
    
    // Check if there is already a record for this ad and target date
    const key = getAdKey(rec);
    const existing = effectiveAllRecords.find((r) => getAdKey(r) === key && r.date === targetDate);
    if (existing) {
      setQuickLogSpend(existing.dailySpend.toString());
      setQuickLogSales(existing.salesCount.toString());
      setQuickLogNotes(existing.notes || '');
    } else {
      setQuickLogSpend(rec.dailySpend > 0 ? rec.dailySpend.toString() : '30');
      setQuickLogSales('0');
      setQuickLogNotes('');
    }
  };

  // When date changes inside Quick Log modal
  const handleQuickLogDateChange = (newDate: string) => {
    setQuickLogDate(newDate);
    if (!quickLogRecord) return;
    const key = getAdKey(quickLogRecord);
    const existing = effectiveAllRecords.find((r) => getAdKey(r) === key && r.date === newDate);
    if (existing) {
      setQuickLogSpend(existing.dailySpend.toString());
      setQuickLogSales(existing.salesCount.toString());
      setQuickLogNotes(existing.notes || '');
    } else {
      setQuickLogSpend(quickLogRecord.dailySpend > 0 ? quickLogRecord.dailySpend.toString() : '30');
      setQuickLogSales('0');
      setQuickLogNotes('');
    }
  };

  // Save quick log entry
  const handleSaveQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogRecord) return;

    const spendNum = parseFloat(quickLogSpend) || 0;
    const salesNum = parseInt(quickLogSales, 10) || 0;
    const calculatedCPA = salesNum > 0 ? spendNum / salesNum : 0;

    const getMonthName = (dateStr: string) => {
      const monthIdx = parseInt(dateStr.split('-')[1], 10) - 1;
      const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return MONTH_NAMES[monthIdx] || 'Agosto';
    };

    const key = getAdKey(quickLogRecord);
    const existing = effectiveAllRecords.find((r) => getAdKey(r) === key && r.date === quickLogDate);

    const finalAdId = quickLogRecord.adId || getDefaultAdIdForProduct(quickLogRecord.defaultProduct, effectiveAllRecords);

    // Persist preset for future automatic prefill
    if (quickLogRecord.defaultProduct) {
      const depts = quickLogRecord.department
        ? quickLogRecord.department.split(',').map((d) => d.trim()).filter(Boolean)
        : ['Lima'];
      saveProductAdPreset(quickLogRecord.defaultProduct, {
        adId: finalAdId,
        departments: depts,
        dailySpend: spendNum > 0 ? spendNum.toFixed(2) : undefined,
        imageUrl: quickLogRecord.imageUrl,
        platform: quickLogRecord.platform || 'Meta Ads (FB / IG)',
      });
    }

    if (existing) {
      // Update existing record for that date
      const updated: DailySaleRecord = {
        ...existing,
        adId: existing.adId || finalAdId,
        dailySpend: parseFloat(spendNum.toFixed(2)),
        salesCount: salesNum,
        cpa: parseFloat(calculatedCPA.toFixed(2)),
        notes: quickLogNotes,
      };
      onUpdateRecord(updated);
    } else {
      // Create new daily entry for this ad on that date
      const newRec: DailySaleRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        adId: finalAdId,
        date: quickLogDate,
        month: getMonthName(quickLogDate),
        platform: quickLogRecord.platform || 'Meta Ads (FB / IG)',
        defaultProduct: quickLogRecord.defaultProduct,
        department: quickLogRecord.department,
        dailySpend: parseFloat(spendNum.toFixed(2)),
        salesCount: salesNum,
        cpa: parseFloat(calculatedCPA.toFixed(2)),
        notes: quickLogNotes,
        imageUrl: quickLogRecord.imageUrl,
      };
      if (onAddRecord) {
        onAddRecord(newRec);
      } else {
        onUpdateRecord(newRec);
      }
    }

    setQuickLogRecord(null);
  };

  // Totals calculations
  const totalSpend = records.reduce((sum, r) => sum + (r.dailySpend || 0), 0);
  const totalSales = records.reduce((sum, r) => sum + (r.salesCount || 0), 0);
  const averageCPA = totalSales > 0 ? totalSpend / totalSales : 0;

  const totalRevenue = records.reduce((sum, r) => {
    const p = getProductInfo(r.defaultProduct);
    const price = p?.salePrice || 79.0;
    return sum + (r.salesCount || 0) * price;
  }, 0);

  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const isAllSelected = records.length > 0 && selectedIds.length === records.length;

  return (
    <div className="space-y-3 animate-in fade-in duration-150 relative">
      {/* Small, discreet toast notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-3.5 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200 border text-xs font-semibold ${
            toastMessage.type === 'warning'
              ? 'bg-amber-900/95 text-amber-100 border-amber-500/40 shadow-amber-950/30'
              : toastMessage.type === 'info'
              ? 'bg-slate-900/95 text-cyan-100 border-cyan-500/40 shadow-slate-950/30'
              : 'bg-emerald-900/95 text-emerald-100 border-emerald-500/40 shadow-emerald-950/30'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 ${
              toastMessage.type === 'warning'
                ? 'bg-amber-500 text-slate-950'
                : toastMessage.type === 'info'
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-emerald-400 text-slate-950'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <Minus className="w-3 h-3 stroke-[3]" />
            ) : toastMessage.type === 'info' ? (
              <DollarSign className="w-3 h-3 stroke-[3]" />
            ) : (
              <Check className="w-3 h-3 stroke-[3]" />
            )}
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-bold text-white">{toastMessage.text}</span>
            {toastMessage.subtext && (
              <span className="text-white/70 text-[11px] font-normal">
                • {toastMessage.subtext}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bulk actions banner if items are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedIds.length} anuncio(s) seleccionado(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearSelection}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onBulkDelete}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar seleccionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Meta Ads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Meta Ads Table Header */}
            <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-3 w-8 text-center">
                  <button
                    type="button"
                    onClick={isAllSelected ? onClearSelection : onSelectAll}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Seleccionar todos"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-2.5 w-14 text-center">Estado</th>
                <th className="py-3.5 px-3 w-16">Creativo</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nombre del Anuncio & ID Meta</th>
                <th className="py-3.5 px-3 min-w-[105px]">Fecha</th>
                <th className="py-3.5 px-4 min-w-[130px]">Importe Gastado</th>
                <th className="py-3.5 px-4 min-w-[145px]">Resultados (Ventas)</th>
                <th className="py-3.5 px-4 min-w-[115px]">CPA</th>
                <th className="py-3.5 px-4 min-w-[110px]">Ingresos Est.</th>
                <th className="py-3.5 px-4 min-w-[90px]">ROAS</th>
                <th className="py-3.5 px-4 min-w-[130px]">Segmentación</th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">Acciones</th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => {
                const isSelected = selectedIds.includes(rec.id);
                const isToday = rec.date === todayStr;
                const prod = getProductInfo(rec.defaultProduct);
                const displayImage = rec.imageUrl || prod?.imageUrl;
                const salePrice = prod?.salePrice || 79.0;
                const estRevenue = rec.salesCount * salePrice;
                const roas = rec.dailySpend > 0 ? estRevenue / rec.dailySpend : 0;
                const adKey = getAdKey(rec);
                const historyList = getAdHistoryDates(rec);
                const hasMultipleDays = historyList.length > 1;
                const isExpanded = expandedAdKeys.includes(adKey);

                return (
                  <React.Fragment key={rec.id}>
                    <tr
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isSelected
                          ? 'bg-blue-50/50'
                          : isToday
                          ? 'bg-emerald-50/20'
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleSelect(rec.id)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Switch Toggle Estado */}
                      <td className="py-3.5 px-2.5 text-center">
                        <span
                          className="inline-block w-8 h-4.5 bg-emerald-500 rounded-full relative cursor-pointer shadow-2xs"
                          title="Anuncio Activo en Meta Ads"
                        >
                          <span className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-xs" />
                        </span>
                      </td>

                      {/* Creativo Miniatura con Zoom */}
                      <td className="py-3.5 px-3">
                        <div className="relative w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-200 group/thumb shadow-2xs">
                          {displayImage ? (
                            <>
                              <img
                                src={displayImage}
                                alt={rec.defaultProduct}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                              />
                              <button
                                type="button"
                                onClick={() => onViewImage(displayImage, rec)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                title="Ver creativo ampliado"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nombre del Anuncio & ID Meta */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 text-sm block leading-tight">
                            {rec.defaultProduct}
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(() => {
                              const effectiveAdId = rec.adId || getDefaultAdIdForProduct(rec.defaultProduct, effectiveAllRecords);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleCopyAdId(effectiveAdId)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer border border-slate-200"
                                  title="Copiar ID predeterminado del anuncio"
                                >
                                  <Tag className="w-2.5 h-2.5 text-cyan-600" />
                                  <span>#{effectiveAdId}</span>
                                  {copiedId === effectiveAdId ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 text-slate-400" />
                                  )}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* Fecha del Registro / Anuncio */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono font-bold text-xs">
                          <span
                            className={
                              isToday
                                ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-black'
                                : 'text-slate-800'
                            }
                          >
                            {rec.date}
                          </span>
                        </div>
                        {isToday && (
                          <span className="text-[9px] font-black text-emerald-600 block uppercase tracking-wider mt-0.5">
                            Hoy (En vivo)
                          </span>
                        )}
                      </td>

                      {/* Gasto Publicidad con Edición Rápida */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {editingSpendId === rec.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              autoFocus
                              value={spendInput}
                              onChange={(e) => setSpendInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSpend(rec);
                                if (e.key === 'Escape') setEditingSpendId(null);
                              }}
                              className="w-20 px-2 py-1 bg-white border-2 border-blue-500 rounded-lg text-xs font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSpend(rec)}
                              className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSpendInput(rec.dailySpend.toString());
                              setEditingSpendId(rec.id);
                            }}
                            className="font-black font-mono text-sm text-slate-900 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer group"
                            title="Clic para editar gasto de este día"
                          >
                            <span>S/ {rec.dailySpend.toFixed(2)}</span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>

                      {/* Resultados (Ventas WhatsApp) - Edición Rápida y Botón +1 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {editingSalesId === rec.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              autoFocus
                              value={salesInput}
                              onChange={(e) => setSalesInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSales(rec);
                                if (e.key === 'Escape') setEditingSalesId(null);
                              }}
                              className="w-16 px-2 py-1 bg-white border-2 border-emerald-500 rounded-lg text-xs font-mono font-black text-emerald-700"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSales(rec)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div className="relative flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSalesInput(rec.salesCount.toString());
                                setEditingSalesId(rec.id);
                              }}
                              className="font-black font-mono text-sm px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="Haz clic para escribir el número de ventas"
                            >
                              <span>{rec.salesCount}</span>
                              <span className="text-[10px] font-bold text-emerald-600/75 uppercase tracking-wider">
                                {rec.salesCount === 1 ? 'venta' : 'ventas'}
                              </span>
                              <Edit2 className="w-2.5 h-2.5 text-emerald-600 opacity-60 ml-0.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Costo por Resultado (CPA) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black font-mono border ${
                            rec.salesCount === 0
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : rec.cpa <= 10
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.cpa <= 20
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          S/ {rec.cpa.toFixed(2)}
                        </span>
                      </td>

                      {/* Ingresos Estimados */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold font-mono text-slate-800">
                        S/ {estRevenue.toFixed(2)}
                      </td>

                      {/* ROAS Estimado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                            roas >= 3
                              ? 'bg-purple-100 text-purple-800'
                              : roas >= 1.5
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {roas.toFixed(2)}x
                        </span>
                      </td>

                      {/* Segmentación */}
                      <td className="py-3.5 px-4">
                        {rec.department ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold truncate max-w-[120px]">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{rec.department}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Nacional (Perú)</span>
                        )}
                      </td>

                      {/* Acciones del Anuncio */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Registrar Día / Hoy */}
                          <button
                            type="button"
                            onClick={() => handleOpenQuickLog(rec, todayStr)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Registrar ventas o gasto de otra fecha en este mismo anuncio"
                          >
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>+ Día</span>
                          </button>

                          {/* Botón Editar Anuncio */}
                          <button
                            type="button"
                            onClick={() => onStartEdit(rec)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar anuncio general (producto, ID, imagen, segmentación)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Daily Breakdown Sub-Table */}
                    {isExpanded && (
                      <tr className="bg-slate-900/5 border-y border-slate-200/80">
                        <td colSpan={12} className="py-3 px-6">
                          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Historial de Fechas para: <strong>{rec.defaultProduct}</strong></span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenQuickLog(rec, todayStr)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Registrar Nueva Fecha</span>
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                                    <th className="py-1.5 px-2">Fecha</th>
                                    <th className="py-1.5 px-2">Gasto (S/)</th>
                                    <th className="py-1.5 px-2">Ventas WhatsApp</th>
                                    <th className="py-1.5 px-2">CPA</th>
                                    <th className="py-1.5 px-2">Ingresos Est.</th>
                                    <th className="py-1.5 px-2">ROAS</th>
                                    <th className="py-1.5 px-2 text-right">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {historyList.map((hist) => {
                                    const hIsToday = hist.date === todayStr;
                                    const hProd = getProductInfo(hist.defaultProduct);
                                    const hPrice = hProd?.salePrice || 79.0;
                                    const hRev = hist.salesCount * hPrice;
                                    const hRoas = hist.dailySpend > 0 ? hRev / hist.dailySpend : 0;

                                    return (
                                      <tr key={hist.id} className={`hover:bg-slate-50 ${hIsToday ? 'bg-emerald-50/30' : ''}`}>
                                        <td className="py-2 px-2 font-mono font-bold">
                                          <div className="flex items-center gap-1.5">
                                            <span>{hist.date}</span>
                                            {hIsToday && (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-white font-black">
                                                HOY
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-2 px-2 font-mono font-bold text-slate-900">
                                          S/ {hist.dailySpend.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-2">
                                          <div className="relative flex items-center gap-1">
                                            {hist.salesCount > 0 && (
                                              <button
                                                type="button"
                                                onClick={() => handleDeltaSales(hist, -1)}
                                                className="w-5 h-5 rounded bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 text-[10px] font-black flex items-center justify-center cursor-pointer transition-colors"
                                                title="Minimizar / Restar 1 venta"
                                              >
                                                -
                                              </button>
                                            )}
                                            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                              {hist.salesCount} ventas
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleDeltaSales(hist, 1)}
                                              className="w-5 h-5 rounded bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center cursor-pointer hover:bg-emerald-700"
                                              title="+1 venta"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </td>
                                        <td className="py-2 px-2 font-mono font-bold">
                                          S/ {hist.cpa.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-2 font-mono font-bold text-slate-800">
                                          S/ {hRev.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-2 font-mono font-bold">
                                          {hRoas.toFixed(2)}x
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenQuickLog(hist, hist.date)}
                                              className="p-1 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                                              title="Editar métricas de esta fecha"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onDeleteRecord(hist.id)}
                                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                              title="Eliminar este día"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {records.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold">No se encontraron anuncios para el filtro seleccionado</p>
                      <p className="text-xs">Crea un nuevo anuncio o cambia el rango de fechas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Meta Ads Sticky Summary Bottom Row */}
            {records.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
                <tr>
                  <td colSpan={5} className="py-4 px-4 uppercase tracking-wider text-slate-300">
                    Total Meta Ads ({records.length} registros)
                  </td>
                  <td className="py-4 px-4 font-black font-mono text-sm text-cyan-400">
                    S/ {totalSpend.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 font-black font-mono text-sm text-emerald-400">
                    {totalSales} compras
                  </td>
                  <td className="py-4 px-4 font-black font-mono text-sm text-amber-400">
                    S/ {averageCPA.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 font-black font-mono text-sm text-indigo-400">
                    S/ {totalRevenue.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 font-black font-mono text-sm text-purple-400">
                    {overallROAS.toFixed(2)}x
                  </td>
                  <td colSpan={2} className="py-4 px-4 text-right text-slate-400 text-[11px]">
                    Retorno consolidado
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Quick Daily Log Modal */}
      {quickLogRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Registrar Métricas por Fecha
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mismo anuncio • Gastos y ventas por día
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickLogRecord(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveQuickLog} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Target Ad Info Card */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                  {quickLogRecord.imageUrl || getProductInfo(quickLogRecord.defaultProduct)?.imageUrl ? (
                    <img
                      src={quickLogRecord.imageUrl || getProductInfo(quickLogRecord.defaultProduct)?.imageUrl}
                      alt={quickLogRecord.defaultProduct}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-900 text-sm block truncate">
                    {quickLogRecord.defaultProduct}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                    <span>
                      ID: #{quickLogRecord.adId || getDefaultAdIdForProduct(quickLogRecord.defaultProduct, effectiveAllRecords)}
                    </span>
                    {quickLogRecord.department && (
                      <span className="text-slate-600 truncate">• {quickLogRecord.department}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Fecha a Registrar / Actualizar</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickLogDateChange(todayStr)}
                      className={`px-2 py-0.5 rounded font-black text-[10px] cursor-pointer transition-colors ${
                        quickLogDate === todayStr
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        handleQuickLogDateChange(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-0.5 rounded font-black text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      Ayer
                    </button>
                  </div>
                </label>
                <input
                  type="date"
                  required
                  value={quickLogDate}
                  onChange={(e) => handleQuickLogDateChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-black font-mono focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                />
              </div>

              {/* Spend & Sales Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-gradient-to-r from-blue-50/80 to-emerald-50/80 p-3.5 rounded-2xl border border-blue-200">
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    <span>Gasto Publicidad (S/)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="30.00"
                      value={quickLogSpend}
                      onChange={(e) => setQuickLogSpend(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ventas WhatsApp</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="2"
                    value={quickLogSales}
                    onChange={(e) => setQuickLogSales(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black font-mono text-emerald-700 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Live Preview of Metrics */}
              {(() => {
                const sp = parseFloat(quickLogSpend) || 0;
                const sl = parseInt(quickLogSales, 10) || 0;
                const cpa = sl > 0 ? sp / sl : 0;
                const prod = getProductInfo(quickLogRecord.defaultProduct);
                const price = prod?.salePrice || 79.0;
                const rev = sl * price;
                const roas = sp > 0 ? rev / sp : 0;

                return (
                  <div className="bg-slate-900 text-white rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">CPA</span>
                      <span className="font-mono font-bold text-amber-400">S/ {cpa.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Facturación Est.</span>
                      <span className="font-mono font-bold text-cyan-400">S/ {rev.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">ROAS</span>
                      <span className={`font-mono font-black ${roas >= 3 ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {roas.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de este día (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Buena tasa de conversión por la tarde..."
                  value={quickLogNotes}
                  onChange={(e) => setQuickLogNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuickLogRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Métricas de la Fecha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
