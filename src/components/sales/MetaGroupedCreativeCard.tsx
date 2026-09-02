import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  Zap,
  Trash2,
  Edit2,
  Maximize2,
  Upload,
  Tag,
  MapPin,
  Plus,
  Minus,
  Copy,
  Check,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Clock,
  X,
  Search,
} from 'lucide-react';
import { DailySaleRecord, Product, PricingCalculationRecord } from '../../types';
import { compressImage } from '../../lib/imageUtils';
import {
  getDefaultAdIdForProduct,
  resolveRecordPriceAndCost,
  saveProductAdPreset,
  getLocalDateString,
  getYesterdayDateString,
  getMonthNameFromDateString
} from '../../lib/adUtils';

export type CardDateFilter =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last14'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'all'
  | 'single'
  | 'custom';

export interface GroupedCreative {
  key: string; // product name or adId
  primaryProduct: string;
  adId: string;
  imageUrl?: string;
  records: DailySaleRecord[];
}

export const PERU_25_DEPARTMENTS = [
  'Amazonas',
  'Áncash',
  'Apurímac',
  'Arequipa',
  'Ayacucho',
  'Cajamarca',
  'Callao',
  'Cusco',
  'Huancavelica',
  'Huánuco',
  'Ica',
  'Junín',
  'La Libertad',
  'Lambayeque',
  'Lima',
  'Loreto',
  'Madre de Dios',
  'Moquegua',
  'Pasco',
  'Piura',
  'Puno',
  'San Martín',
  'Tacna',
  'Tumbes',
  'Ucayali',
  'Nacional',
];

export const POPULAR_PERU_DEPARTMENTS = PERU_25_DEPARTMENTS;

interface MetaGroupedCreativeCardProps {
  creative: GroupedCreative;
  products: Product[];
  pricingRecords?: PricingCalculationRecord[];
  todayStr: string;
  globalDatePreset?: string;
  globalSelectedDate?: string;
  onAddDailyRecord: (record: DailySaleRecord) => void;
  onUpdateDailyRecord: (record: DailySaleRecord) => void;
  onDeleteDailyRecord: (id: string) => void;
  onDeleteCreative?: (creative: GroupedCreative) => void;
  onStartEdit: (record: DailySaleRecord) => void;
  onViewImage: (imageUrl: string, record?: DailySaleRecord) => void;
}

export const MetaGroupedCreativeCard: React.FC<MetaGroupedCreativeCardProps> = ({
  creative,
  products,
  pricingRecords = [],
  todayStr,
  globalDatePreset,
  globalSelectedDate,
  onAddDailyRecord,
  onUpdateDailyRecord,
  onDeleteDailyRecord,
  onDeleteCreative,
  onStartEdit,
  onViewImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate default dates reliably in local timezone
  const now = new Date();
  const effectiveTodayStr = todayStr || getLocalDateString(now);
  const yesterdayStr = getYesterdayDateString(now);

  const sevenDaysAgoObj = new Date(now);
  sevenDaysAgoObj.setDate(sevenDaysAgoObj.getDate() - 7);
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgoObj);

  const fourteenDaysAgoObj = new Date(now);
  fourteenDaysAgoObj.setDate(fourteenDaysAgoObj.getDate() - 14);
  const fourteenDaysAgoStr = getLocalDateString(fourteenDaysAgoObj);

  const thirtyDaysAgoObj = new Date(now);
  thirtyDaysAgoObj.setDate(thirtyDaysAgoObj.getDate() - 30);
  const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgoObj);

  const currentMonthPrefix = effectiveTodayStr.substring(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const [dateFilter, setDateFilter] = useState<CardDateFilter>(() => {
    if (globalDatePreset === 'yesterday') return 'yesterday';
    if (globalDatePreset === 'specific_date') return 'single';
    if (globalDatePreset === 'last_7_days') return 'last7';
    if (globalDatePreset === 'last_14_days') return 'last14';
    if (globalDatePreset === 'last_30_days') return 'last30';
    if (globalDatePreset === 'this_month') return 'thisMonth';
    if (globalDatePreset === 'all') return 'all';
    return 'today';
  });

  const [selectedDate, setSelectedDate] = useState<string>(globalSelectedDate || effectiveTodayStr);
  const [customStartDate, setCustomStartDate] = useState<string>(sevenDaysAgoStr);
  const [customEndDate, setCustomEndDate] = useState<string>(effectiveTodayStr);
  const [copiedId, setCopiedId] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // React to global date preset changes from header bar
  useEffect(() => {
    if (globalDatePreset) {
      if (globalDatePreset === 'today') {
        setDateFilter('today');
        setSelectedDate(effectiveTodayStr);
      } else if (globalDatePreset === 'yesterday') {
        setDateFilter('yesterday');
        setSelectedDate(yesterdayStr);
      } else if (globalDatePreset === 'specific_date') {
        setDateFilter('single');
        if (globalSelectedDate) {
          setSelectedDate(globalSelectedDate);
        }
      } else if (globalDatePreset === 'last_7_days') {
        setDateFilter('last7');
      } else if (globalDatePreset === 'last_14_days') {
        setDateFilter('last14');
      } else if (globalDatePreset === 'last_30_days') {
        setDateFilter('last30');
      } else if (globalDatePreset === 'this_month') {
        setDateFilter('thisMonth');
      } else if (globalDatePreset === 'all') {
        setDateFilter('all');
      }
    }
  }, [globalDatePreset, globalSelectedDate, effectiveTodayStr, yesterdayStr]);

  // Direct edit states
  const [isEditingAdId, setIsEditingAdId] = useState(false);
  const [adIdInput, setAdIdInput] = useState('');
  const [isEditingSpend, setIsEditingSpend] = useState(false);
  const [spendInput, setSpendInput] = useState('');
  const [isEditingSales, setIsEditingSales] = useState(false);
  const [salesInput, setSalesInput] = useState('');
  const [isAddingDeptOpen, setIsAddingDeptOpen] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [customDeptInput, setCustomDeptInput] = useState('');

  // Find matching product in catalog
  const cleanProductName = (creative.primaryProduct || '').trim().toLowerCase();
  const matchedProduct =
    products.find((p) => p.name.trim().toLowerCase() === cleanProductName) ||
    products.find(
      (p) =>
        cleanProductName.length >= 3 &&
        (p.name.toLowerCase().includes(cleanProductName) || cleanProductName.includes(p.name.toLowerCase()))
    );

  const displayImage =
    creative.imageUrl ||
    creative.records.find((r) => r.imageUrl)?.imageUrl ||
    matchedProduct?.imageUrl;

  const effectiveAdId = creative.adId || getDefaultAdIdForProduct(creative.primaryProduct);
  const salePrice = matchedProduct?.salePrice || 79.0;

  // Single day vs multi-day mode detection
  const isSingleDateMode = dateFilter === 'today' || dateFilter === 'yesterday' || dateFilter === 'single';
  const effectiveSingleDate =
    dateFilter === 'today' ? todayStr : dateFilter === 'yesterday' ? yesterdayStr : selectedDate;

  // Find record for the currently selected single date
  const targetSingleRecord = creative.records.find((r) => r.date === effectiveSingleDate);
  const isToday = effectiveSingleDate === todayStr;

  // Filter records based on this card's selected filter mode
  const activeRecords = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return creative.records.filter((r) => r.date === todayStr);
      case 'yesterday':
        return creative.records.filter((r) => r.date === yesterdayStr);
      case 'last7':
        return creative.records.filter((r) => r.date >= sevenDaysAgoStr && r.date <= todayStr);
      case 'last14':
        return creative.records.filter((r) => r.date >= fourteenDaysAgoStr && r.date <= todayStr);
      case 'last30':
        return creative.records.filter((r) => r.date >= thirtyDaysAgoStr && r.date <= todayStr);
      case 'thisMonth':
        return creative.records.filter((r) => r.date.startsWith(currentMonthPrefix));
      case 'lastMonth':
        return creative.records.filter((r) => r.date.startsWith(lastMonthPrefix));
      case 'single':
        return creative.records.filter((r) => r.date === selectedDate);
      case 'custom':
        return creative.records.filter((r) => {
          if (!customStartDate && !customEndDate) return true;
          if (customStartDate && !customEndDate) return r.date >= customStartDate;
          if (!customStartDate && customEndDate) return r.date <= customEndDate;
          return r.date >= customStartDate && r.date <= customEndDate;
        });
      case 'all':
      default:
        return creative.records;
    }
  }, [
    creative.records,
    dateFilter,
    todayStr,
    yesterdayStr,
    sevenDaysAgoStr,
    fourteenDaysAgoStr,
    thirtyDaysAgoStr,
    currentMonthPrefix,
    lastMonthPrefix,
    selectedDate,
    customStartDate,
    customEndDate,
  ]);

  // Resolve pricing & costs for all active records
  const resolvedMetrics = useMemo(() => {
    return activeRecords.map((r) => resolveRecordPriceAndCost(r, products, pricingRecords));
  }, [activeRecords, products, pricingRecords]);

  // Aggregate metrics for selected date range
  const totalSpend = activeRecords.reduce((sum, r) => sum + (r.dailySpend || 0), 0);
  const totalSales = activeRecords.reduce((sum, r) => sum + (r.salesCount || 0), 0);
  const calculatedCPA = totalSales > 0 ? totalSpend / totalSales : 0;
  const totalRevenue = resolvedMetrics.reduce((sum, item) => sum + item.revenue, 0);
  const totalCOGS = resolvedMetrics.reduce((sum, item) => sum + item.cogs, 0);
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const netProfit = totalRevenue - totalSpend - totalCOGS;

  const defaultResolved = useMemo(() => {
    return resolveRecordPriceAndCost({ defaultProduct: creative.primaryProduct }, products, pricingRecords);
  }, [creative.primaryProduct, products, pricingRecords]);

  const effectiveUnitPrice = resolvedMetrics[0]?.unitPrice || defaultResolved.unitPrice;

  // Departments across all records
  const allDepartments: string[] = Array.from(
    new Set(
      creative.records
        .flatMap((r) => (r.department ? r.department.split(',') : []))
        .map((d) => d.trim())
        .filter(Boolean)
    )
  );

  // Departments specifically for the currently selected date or active period
  const currentDateDepartments: string[] = useMemo(() => {
    if (isSingleDateMode) {
      return targetSingleRecord?.department
        ? targetSingleRecord.department.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }
    return Array.from(
      new Set(
        activeRecords
          .flatMap((r) => (r.department ? r.department.split(',') : []))
          .map((d) => d.trim())
          .filter(Boolean)
      )
    );
  }, [isSingleDateMode, targetSingleRecord?.department, activeRecords]);

  // Search filter for 25 departments of Peru
  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const filteredDepartments = useMemo(() => {
    if (!deptSearchQuery.trim()) return PERU_25_DEPARTMENTS;
    const q = normalizeText(deptSearchQuery);
    return PERU_25_DEPARTMENTS.filter((dept) => normalizeText(dept).includes(q));
  }, [deptSearchQuery]);

  // Handler: Toggle department on the currently selected date (independent per date)
  const handleToggleDepartment = (deptName: string) => {
    if (!isSingleDateMode) return;
    const recordDate = effectiveSingleDate;
    const existing = creative.records.find((r) => r.date === recordDate);
    const currentList = existing?.department
      ? existing.department.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const isPresent = currentList.includes(deptName);
    const updatedList = isPresent
      ? currentList.filter((d) => d !== deptName)
      : [...currentList, deptName];
    const newDeptString = updatedList.join(', ');

    if (existing) {
      onUpdateDailyRecord({
        ...existing,
        department: newDeptString,
      });
    } else {
      const res = resolveRecordPriceAndCost({ defaultProduct: creative.primaryProduct }, products, pricingRecords);
      const newRecord: DailySaleRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: recordDate,
        month: getMonthNameFromDateString(recordDate),
        platform: 'Meta Ads (FB / IG)',
        defaultProduct: creative.primaryProduct,
        adId: effectiveAdId,
        imageUrl: displayImage,
        department: newDeptString,
        dailySpend: 0,
        salesCount: 0,
        unitPrice: res.unitPrice > 0 ? res.unitPrice : undefined,
        unitCost: res.unitCost > 0 ? res.unitCost : undefined,
        cpa: 0,
      };
      onAddDailyRecord(newRecord);
    }
  };

  const handleAddCustomDept = () => {
    if (!isSingleDateMode) return;
    const clean = customDeptInput.trim();
    if (!clean) return;
    handleToggleDepartment(clean);
    setCustomDeptInput('');
  };

  const handleRemoveDepartment = (deptName: string) => {
    if (!isSingleDateMode) return;
    const recordDate = effectiveSingleDate;
    const existing = creative.records.find((r) => r.date === recordDate);
    if (!existing) return;
    const currentList = existing.department
      ? existing.department.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const updatedList = currentList.filter((d) => d !== deptName);
    onUpdateDailyRecord({
      ...existing,
      department: updatedList.join(', '),
    });
  };

  // Handler: Add or increment sale
  const handleDeltaSales = (delta: number) => {
    if (!isSingleDateMode) return;
    const recordDate = effectiveSingleDate;
    const existing = creative.records.find((r) => r.date === recordDate);

    if (existing) {
      const newCount = Math.max(0, (existing.salesCount || 0) + delta);
      const newCPA = newCount > 0 ? existing.dailySpend / newCount : 0;
      onUpdateDailyRecord({
        ...existing,
        salesCount: newCount,
        cpa: parseFloat(newCPA.toFixed(2)),
      });
    } else {
      // Create new record for the selected date
      const res = resolveRecordPriceAndCost({ defaultProduct: creative.primaryProduct }, products, pricingRecords);
      const newRecord: DailySaleRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: recordDate,
        month: getMonthNameFromDateString(recordDate),
        platform: 'Meta Ads (FB / IG)',
        defaultProduct: creative.primaryProduct,
        adId: effectiveAdId,
        imageUrl: displayImage,
        department: currentDateDepartments.length > 0 ? currentDateDepartments.join(', ') : (allDepartments[0] || 'Lima'),
        dailySpend: 0,
        salesCount: Math.max(0, delta),
        unitPrice: res.unitPrice > 0 ? res.unitPrice : undefined,
        unitCost: res.unitCost > 0 ? res.unitCost : undefined,
        cpa: 0,
      };
      onAddDailyRecord(newRecord);
    }
  };

  const handleSaveInlineSpend = () => {
    if (!isSingleDateMode) return;
    const parsed = parseFloat(spendInput);
    const validSpend = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    const recordDate = effectiveSingleDate;
    const existing = creative.records.find((r) => r.date === recordDate);

    if (existing) {
      const newCPA = existing.salesCount > 0 ? validSpend / existing.salesCount : 0;
      onUpdateDailyRecord({
        ...existing,
        dailySpend: parseFloat(validSpend.toFixed(2)),
        cpa: parseFloat(newCPA.toFixed(2)),
      });
    } else {
      const res = resolveRecordPriceAndCost({ defaultProduct: creative.primaryProduct }, products, pricingRecords);
      const newRecord: DailySaleRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: recordDate,
        month: getMonthNameFromDateString(recordDate),
        platform: 'Meta Ads (FB / IG)',
        defaultProduct: creative.primaryProduct,
        adId: effectiveAdId,
        imageUrl: displayImage,
        department: currentDateDepartments.length > 0 ? currentDateDepartments.join(', ') : (allDepartments[0] || 'Lima'),
        dailySpend: validSpend,
        salesCount: 0,
        unitPrice: res.unitPrice > 0 ? res.unitPrice : undefined,
        unitCost: res.unitCost > 0 ? res.unitCost : undefined,
        cpa: 0,
      };
      onAddDailyRecord(newRecord);
    }
    setIsEditingSpend(false);
  };

  const handleSaveInlineSales = () => {
    if (!isSingleDateMode) return;
    const parsed = parseInt(salesInput, 10);
    const validSales = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    const recordDate = effectiveSingleDate;
    const existing = creative.records.find((r) => r.date === recordDate);

    if (existing) {
      const newCPA = validSales > 0 ? existing.dailySpend / validSales : 0;
      onUpdateDailyRecord({
        ...existing,
        salesCount: validSales,
        cpa: parseFloat(newCPA.toFixed(2)),
      });
    } else {
      const res = resolveRecordPriceAndCost({ defaultProduct: creative.primaryProduct }, products, pricingRecords);
      const newRecord: DailySaleRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: recordDate,
        month: getMonthNameFromDateString(recordDate),
        platform: 'Meta Ads (FB / IG)',
        defaultProduct: creative.primaryProduct,
        adId: effectiveAdId,
        imageUrl: displayImage,
        department: currentDateDepartments.length > 0 ? currentDateDepartments.join(', ') : (allDepartments[0] || 'Lima'),
        dailySpend: 0,
        salesCount: validSales,
        unitPrice: res.unitPrice > 0 ? res.unitPrice : undefined,
        unitCost: res.unitCost > 0 ? res.unitCost : undefined,
        cpa: 0,
      };
      onAddDailyRecord(newRecord);
    }
    setIsEditingSales(false);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const base64 = await compressImage(file);
      if (targetSingleRecord) {
        onUpdateDailyRecord({ ...targetSingleRecord, imageUrl: base64 });
      } else if (creative.records.length > 0) {
        onUpdateDailyRecord({ ...creative.records[0], imageUrl: base64 });
      } else {
        const dateObj = new Date(todayStr + 'T12:00:00');
        onAddDailyRecord({
          id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          date: todayStr,
          month: dateObj.toLocaleString('es-ES', { month: 'long' }),
          platform: 'Meta Ads',
          defaultProduct: creative.primaryProduct,
          adId: effectiveAdId,
          imageUrl: base64,
          department: 'Lima',
          dailySpend: 0,
          salesCount: 0,
          cpa: 0,
        });
      }
    } catch (err) {
      console.error('Error cargando imagen:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCopyAdId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(effectiveAdId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveAdId = () => {
    const cleanId = adIdInput.trim().replace(/^#/, '');
    if (!cleanId) {
      setIsEditingAdId(false);
      return;
    }

    // Save preset for future records of this product
    saveProductAdPreset(creative.primaryProduct, { adId: cleanId });

    // Update existing records for this creative
    if (creative.records && creative.records.length > 0) {
      creative.records.forEach((rec) => {
        onUpdateDailyRecord({
          ...rec,
          adId: cleanId,
        });
      });
    }

    setIsEditingAdId(false);
  };

  const handleOpenEditModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isSingleDateMode) return;
    if (targetSingleRecord) {
      onStartEdit(targetSingleRecord);
    } else if (creative.records.length > 0) {
      const baseRec = creative.records[0];
      const dateObj = new Date(effectiveSingleDate + 'T12:00:00');
      const preparedRecord: DailySaleRecord = {
        ...baseRec,
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: effectiveSingleDate,
        month: dateObj.toLocaleString('es-ES', { month: 'long' }),
        dailySpend: 0,
        salesCount: 0,
        cpa: 0,
      };
      onStartEdit(preparedRecord);
    } else {
      const dateObj = new Date(effectiveSingleDate + 'T12:00:00');
      const preparedRecord: DailySaleRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: effectiveSingleDate,
        month: dateObj.toLocaleString('es-ES', { month: 'long' }),
        platform: 'Meta Ads',
        defaultProduct: creative.primaryProduct,
        adId: effectiveAdId,
        department: 'Lima',
        dailySpend: 0,
        salesCount: 0,
        cpa: 0,
        imageUrl: displayImage,
      };
      onStartEdit(preparedRecord);
    }
  };

  // Label for current filter
  const filterLabels: Record<CardDateFilter, string> = {
    today: 'Hoy',
    yesterday: 'Ayer',
    last7: 'Últimos 7 días',
    last14: 'Últimos 14 días',
    last30: 'Últimos 30 días',
    thisMonth: 'Este mes',
    lastMonth: 'Mes anterior',
    all: 'Máximo',
    single: selectedDate === todayStr ? 'Hoy' : selectedDate,
    custom: `${customStartDate || '...'} ➔ ${customEndDate || '...'}`,
  };

  const activePeriodTitle = filterLabels[dateFilter] || 'Filtrar fecha';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group shadow-2xs">
      {/* 1. Header: Creative Name, Ad ID and On/Off Toggle */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>

          {/* Ad ID & Product Title */}
          <div className="min-w-0">
            {isEditingAdId && isSingleDateMode ? (
              <div className="flex items-center gap-1 my-0.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-cyan-400 font-mono text-[11px] font-bold">#</span>
                <input
                  type="text"
                  autoFocus
                  value={adIdInput}
                  onChange={(e) => setAdIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveAdId();
                    if (e.key === 'Escape') setIsEditingAdId(false);
                  }}
                  className="w-24 px-1.5 py-0.5 bg-slate-800 border border-cyan-400 focus:border-cyan-300 rounded text-xs font-mono font-bold text-cyan-200 focus:outline-none"
                  placeholder="ID Anuncio"
                />
                <button
                  type="button"
                  onClick={handleSaveAdId}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                  title="Guardar nuevo ID"
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAdId(false)}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition-colors cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyAdId}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                  title="Copiar ID del anuncio"
                >
                  <span>#{effectiveAdId}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-60" />
                  )}
                </button>

                {isSingleDateMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdIdInput(effectiveAdId);
                      setIsEditingAdId(true);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center"
                    title="Editar solo el ID del anuncio"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <h4 className="font-bold text-white text-xs truncate max-w-[200px]" title={creative.primaryProduct}>
              {creative.primaryProduct}
            </h4>
          </div>
        </div>

        {/* Status Switch & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isSingleDateMode && (
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title="Editar todos los datos (Anuncio, Gasto, Ventas, Ubicación)"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}

          {onDeleteCreative && creative.records.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `¿Eliminar el creativo #${effectiveAdId} (${creative.primaryProduct}) y todos sus registros asociados?`
                  )
                ) {
                  onDeleteCreative(creative);
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Eliminar este anuncio/creativo completo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              isActive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            title={isActive ? 'Creativo Activo en Meta' : 'Creativo Pausado'}
          >
            <span
              className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform shadow-xs ${
                isActive ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Visual Image Creative Showcase */}
      <div className="relative bg-slate-950 aspect-4/3 w-full flex items-center justify-center overflow-hidden border-b border-slate-100">
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={creative.primaryProduct}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Quick Action Buttons over image */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onViewImage(displayImage, targetSingleRecord || creative.records[0])}
                className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg backdrop-blur-xs transition-transform active:scale-95 shadow-md cursor-pointer"
                title="Ampliar creativo en pantalla completa"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-black/60 hover:bg-blue-600 text-white rounded-lg backdrop-blur-xs transition-transform active:scale-95 shadow-md cursor-pointer"
                title="Cambiar imagen del creativo"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 text-center flex flex-col items-center justify-center gap-2 text-slate-400 w-full h-full bg-slate-900">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-300 truncate max-w-[220px]">
              {creative.primaryProduct}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Subir Foto del Anuncio</span>
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Summary Badges on top of image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/75 text-white font-mono text-[10px] font-bold border border-white/10 backdrop-blur-xs flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>{creative.records.length} {creative.records.length === 1 ? 'día' : 'días'} reg.</span>
            </span>
          </div>

          {currentDateDepartments.length > 0 ? (
            <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 font-semibold text-[10px] border border-rose-500/30 backdrop-blur-xs truncate max-w-[150px]">
              📍 {currentDateDepartments[0]} {currentDateDepartments.length > 1 && `(+${currentDateDepartments.length - 1})`}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-black/60 text-slate-300 font-medium text-[10px] border border-white/10 backdrop-blur-xs">
              📍 Sin depto.
            </span>
          )}
        </div>
      </div>

      {/* 3. DATE CONTROLS: PERIODO DE ANUNCIO (SELECT DROPDOWN) + VISIBLE FECHA & PERSONALIZADO */}
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
        {/* Row 1: Periodo de Anuncio (Dropdown en un solo texto hacia abajo) */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Periodo de Anuncio:</span>
            </span>
            <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
              {filterLabels[dateFilter]}
            </span>
          </label>

          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as CardDateFilter)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer hover:bg-slate-50"
            >
              <option value="today">Hoy (Día actual)</option>
              <option value="yesterday">Ayer (Día anterior)</option>
              <option value="last7">Últimos 7 días</option>
              <option value="last14">Últimos 14 días</option>
              <option value="last30">Últimos 30 días</option>
              <option value="thisMonth">Este mes</option>
              <option value="lastMonth">Mes anterior</option>
              <option value="all">Máximo (Todo el historial)</option>
              <option value="single">📅 Por Fecha específica</option>
              <option value="custom">📆 Rango Personalizado</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick Tabs to toggle directly between Por Fecha and Personalizado */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setDateFilter('single')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              dateFilter === 'single' || dateFilter === 'today' || dateFilter === 'yesterday'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Por Fecha</span>
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('custom')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              dateFilter === 'custom'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Personalizado</span>
          </button>
        </div>

        {/* Visible Date Input (When Single Date or Presets are selected) */}
        {(dateFilter === 'single' || dateFilter === 'today' || dateFilter === 'yesterday') && (
          <div className="flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <input
                type="date"
                value={effectiveSingleDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFilter('single');
                }}
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer text-center"
              />
            </div>
            {effectiveSingleDate !== todayStr && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  setDateFilter('today');
                }}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
                title="Volver a la fecha de Hoy"
              >
                Hoy
              </button>
            )}
          </div>
        )}

        {/* Visible Custom Range Inputs (When Custom Range is selected) */}
        {dateFilter === 'custom' && (
          <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-100 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-900">
              <span>Rango de fechas:</span>
              <span className="font-mono text-indigo-600 text-[9.5px]">
                {customStartDate || '...'} ➔ {customEndDate || '...'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Desde</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-white border border-indigo-200 text-slate-800 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer text-center"
                />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Hasta</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-white border border-indigo-200 text-slate-800 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer text-center"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SECCIÓN INDEPENDIENTE DE DEPARTAMENTO POR CADA FECHA */}
      <div className="px-3.5 py-2.5 bg-rose-50/40 border-b border-rose-100/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Departamento / Ubicación:</span>
          </div>
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-100/80 text-rose-800 font-mono">
            {isSingleDateMode ? effectiveSingleDate : activePeriodTitle}
          </span>
        </div>

        {/* Tags de departamentos para la fecha seleccionada */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {currentDateDepartments.length > 0 ? (
            currentDateDepartments.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs"
              >
                <span>📍 {dept}</span>
                {isSingleDateMode && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDepartment(dept)}
                    className="text-rose-400 hover:text-rose-700 ml-0.5 p-0.5 rounded hover:bg-rose-100 cursor-pointer"
                    title={`Quitar ${dept} de la fecha ${effectiveSingleDate}`}
                  >
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">
              {isSingleDateMode ? 'Sin departamento en esta fecha' : 'Sin departamentos en el periodo'}
            </span>
          )}

          {isSingleDateMode && (
            <button
              type="button"
              onClick={() => setIsAddingDeptOpen(!isAddingDeptOpen)}
              title={currentDateDepartments.length === 0 ? 'Agregar departamento' : 'Modificar departamentos'}
              aria-label="Agregar o modificar departamento"
              className={`p-1 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center cursor-pointer ${
                isAddingDeptOpen
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-white hover:bg-rose-100 text-rose-700 border-rose-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Panel para agregar/cambiar departamento de esta fecha */}
        {isSingleDateMode && isAddingDeptOpen && (
          <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-md space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10.5px] font-bold text-slate-700">
                Seleccionar Departamento ({effectiveSingleDate}):
              </div>
              {currentDateDepartments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const recordDate = effectiveSingleDate;
                    const existing = creative.records.find((r) => r.date === recordDate);
                    if (existing) {
                      onUpdateDailyRecord({
                        ...existing,
                        department: '',
                      });
                    }
                  }}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline decoration-dotted"
                >
                  Limpiar ({currentDateDepartments.length})
                </button>
              )}
            </div>

            {/* Buscador con Lupa */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-rose-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                placeholder="Buscar entre los 25 departamentos..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-rose-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium placeholder:text-slate-400 transition-colors"
              />
              {deptSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDeptSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Borrar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Lista Desplegable de Departamentos con Scroll */}
            <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1 border border-slate-100 rounded-lg p-1 bg-slate-50/50">
              {filteredDepartments.length > 0 ? (
                <div className="grid grid-cols-2 gap-1">
                  {filteredDepartments.map((dept) => {
                    const isSelected = currentDateDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => handleToggleDepartment(dept)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-900 border border-slate-200/80 hover:border-rose-200'
                        }`}
                      >
                        <span className="truncate">{dept}</span>
                        {isSelected ? (
                          <Check className="w-3 h-3 text-white shrink-0 stroke-[3]" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-center space-y-1.5">
                  <p className="text-xs text-slate-500">
                    No se encontró <span className="font-semibold text-slate-700">"{deptSearchQuery}"</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleDepartment(deptSearchQuery.trim());
                      setDeptSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Añadir "{deptSearchQuery.trim()}"</span>
                  </button>
                </div>
              )}
            </div>

            {/* Barra de acción inferior */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium">
                {currentDateDepartments.length} {currentDateDepartments.length === 1 ? 'seleccionado' : 'seleccionados'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingDeptOpen(false);
                  setDeptSearchQuery('');
                }}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live WhatsApp Sales & Daily Spend Controller */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Sales Counter Box */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-emerald-50/40 to-slate-50 border border-emerald-200/80 rounded-xl p-3 shadow-xs">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-emerald-100/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <div className="w-5 h-5 rounded-md bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                <Zap className="w-3.5 h-3.5 fill-emerald-600" />
              </div>
              <span>Ventas WhatsApp</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 truncate max-w-[150px]">
              {activePeriodTitle}
            </span>
          </div>

          {/* Action Row: When in Single Date Mode (Hoy, Ayer, Por Fecha) -> show [-1] | [Sales Count] | [+1]
              When in Multi-day/Aggregate Mode -> hide +/- buttons and show clean period total */}
          {isSingleDateMode ? (
            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Minus 1 Button - Highly visible with bold minus icon and label */}
              <div className="col-span-3">
                <button
                  type="button"
                  onClick={() => handleDeltaSales(-1)}
                  disabled={(targetSingleRecord?.salesCount || 0) <= 0}
                  className="w-full h-12 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border-2 border-rose-300 hover:border-rose-400 disabled:opacity-30 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 font-black transition-all active:scale-95 shadow-sm cursor-pointer"
                  title="Restar 1 venta (-1)"
                >
                  <Minus className="w-5 h-5 stroke-[3.5]" />
                  <span className="text-sm font-black">-1</span>
                </button>
              </div>

              {/* Sales Count Display & Inline Edit for Single Date */}
              <div className="col-span-5 flex items-center justify-center">
                {isEditingSales ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      value={salesInput}
                      onChange={(e) => setSalesInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveInlineSales();
                        if (e.key === 'Escape') setIsEditingSales(false);
                      }}
                      className="w-full text-center text-xl font-black font-mono bg-white border-2 border-emerald-500 rounded-lg py-1 text-emerald-700 focus:outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleSaveInlineSales}
                      className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSalesInput((targetSingleRecord?.salesCount || 0).toString());
                      setIsEditingSales(true);
                    }}
                    className="w-full text-center py-1.5 px-2 rounded-xl bg-white hover:bg-emerald-50/50 border-2 border-emerald-300 transition-all group/count cursor-pointer shadow-xs"
                    title="Haz clic para escribir número exacto de ventas en esta fecha"
                  >
                    <div className="text-2xl font-black font-mono text-emerald-700 leading-none">
                      {totalSales}
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold group-hover/count:text-emerald-950 transition-colors block mt-0.5">
                      {totalSales === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </button>
                )}
              </div>

              {/* Plus 1 Button - Highly visible with bold plus icon and label */}
              <div className="col-span-4">
                <button
                  type="button"
                  onClick={() => handleDeltaSales(1)}
                  className="w-full h-12 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 border-2 border-emerald-600 hover:border-emerald-700 transition-all active:scale-95 cursor-pointer"
                  title={`Sumar +1 venta (${activePeriodTitle})`}
                >
                  <Plus className="w-5 h-5 stroke-[3.5]" />
                  <span className="text-sm font-black">+1</span>
                </button>
              </div>
            </div>
          ) : (
            /* Multi-day / Aggregate View: Buttons -1 and +1 are hidden */
            <div className="w-full py-2.5 px-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ventas del Periodo
                </span>
                <span className="text-xs text-emerald-800 font-medium">
                  {activePeriodTitle}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {totalSales}
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  {totalSales === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Performance Metrics Grid for the selected date / range */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Gasto Publicitario */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                Gasto ({activePeriodTitle})
              </span>
            </div>

            {isEditingSpend && isSingleDateMode ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={spendInput}
                  onChange={(e) => setSpendInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveInlineSpend();
                    if (e.key === 'Escape') setIsEditingSpend(false);
                  }}
                  className="w-full text-xs font-mono font-bold bg-white border border-blue-400 rounded px-1.5 py-0.5"
                />
                <button
                  type="button"
                  onClick={handleSaveInlineSpend}
                  className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold"
                >
                  ✓
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-black font-mono text-slate-900 text-sm">
                  S/ {totalSpend.toFixed(2)}
                </span>
                {isSingleDateMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpendInput((targetSingleRecord?.dailySpend || 0).toString());
                      setIsEditingSpend(true);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Editar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CPA Promedio */}
          <div
            className={`p-2.5 rounded-xl border ${
              totalSales === 0
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : calculatedCPA <= 12
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : calculatedCPA <= 22
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span className="text-[10px] font-bold uppercase block mb-1">
              CPA Promedio
            </span>
            <span className="font-black font-mono text-sm block">
              {totalSales > 0 ? `S/ ${calculatedCPA.toFixed(2)}` : 'S/ 0.00'}
            </span>
          </div>

          {/* Facturación Estimada */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 truncate">
              Ingresos ({activePeriodTitle})
            </span>
            <span className="font-black font-mono text-sm text-indigo-700 block">
              S/ {totalRevenue.toFixed(2)}
            </span>
          </div>

          {/* ROAS Estimado */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
              ROAS Estimado
            </span>
            <span
              className={`font-black font-mono text-sm block ${
                roas >= 3 ? 'text-purple-700 font-black' : 'text-slate-800'
              }`}
            >
              {roas.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* 6. Footer Actions */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
          {isSingleDateMode ? (
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="px-2.5 py-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 bg-slate-100/90 hover:border-blue-300 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs"
              title="Editar todos los campos y detalles del anuncio"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Editar Todo</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 font-medium italic">
              Modo acumulado ({activePeriodTitle})
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
              {targetSingleRecord
                ? `✓ ${activePeriodTitle}`
                : `Total ${activePeriodTitle}`}
            </span>

            {isSingleDateMode && targetSingleRecord && (
              <button
                type="button"
                onClick={() => onDeleteDailyRecord(targetSingleRecord.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar registro seleccionado"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
