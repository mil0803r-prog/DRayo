import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DailySaleRecord, Product, PricingCalculationRecord } from '../../types';
import { ImageDropzone } from './ImageDropzone';
import {
  generateMetaAdId,
  getDefaultAdIdForProduct,
  getProductPreset,
  saveProductAdPreset,
  getAllSavedPresets,
  resolveRecordPriceAndCost
} from '../../lib/adUtils';
import {
  X,
  Layers,
  Calendar,
  DollarSign,
  ShoppingBag,
  Tag,
  MapPin,
  Sparkles,
  Zap,
  Check,
  TrendingUp,
  Image as ImageIcon,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Search,
  Package
} from 'lucide-react';

interface MetaAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DailySaleRecord) => void;
  editingRecord?: DailySaleRecord | null;
  products: Product[];
  pricingRecords?: PricingCalculationRecord[];
  todayStr: string;
  dailyRecords?: DailySaleRecord[];
}

const PERU_25_DEPARTMENTS = [
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
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MetaAdModal: React.FC<MetaAdModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRecord,
  products,
  pricingRecords = [],
  todayStr,
  dailyRecords = [],
}) => {
  const [date, setDate] = useState<string>(todayStr);
  const [platform, setPlatform] = useState<string>('Meta Ads (FB / IG)');
  const [productName, setProductName] = useState<string>('');
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState<string>('');
  const [adId, setAdId] = useState<string>('');
  const [dailySpend, setDailySpend] = useState<string>('25.00');
  const [salesCount, setSalesCount] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('99.00');
  const [unitCost, setUnitCost] = useState<string>('30.00');
  const [department, setDepartment] = useState<string>('Lima');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['Lima']);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState<boolean>(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const [isIdSuggestionsOpen, setIsIdSuggestionsOpen] = useState<boolean>(false);
  const idContainerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Extract all unique registered ads from dailyRecords & saved presets
  const registeredAds = useMemo(() => {
    const map = new Map<string, {
      adId: string;
      productName: string;
      dailySpend?: string;
      department?: string;
      departments?: string[];
      platform?: string;
      imageUrl?: string;
      lastDate?: string;
    }>();

    // 1. From dailyRecords (sorted chronologically so latest info takes precedence)
    if (dailyRecords && dailyRecords.length > 0) {
      const sorted = [...dailyRecords].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      sorted.forEach((r) => {
        const cleanId = (r.adId || '').trim().replace(/^#/, '');
        if (cleanId) {
          const depts = r.department ? r.department.split(',').map((d) => d.trim()).filter(Boolean) : undefined;
          map.set(cleanId.toLowerCase(), {
            adId: cleanId,
            productName: r.defaultProduct || 'Anuncio Registrado',
            dailySpend: r.dailySpend !== undefined ? r.dailySpend.toFixed(2) : undefined,
            department: r.department,
            departments: depts,
            platform: r.platform,
            imageUrl: r.imageUrl,
            lastDate: r.date,
          });
        }
      });
    }

    // 2. From saved persistent presets
    const presets = getAllSavedPresets();
    Object.entries(presets).forEach(([prodKey, p]) => {
      if (p.adId) {
        const cleanId = p.adId.trim().replace(/^#/, '');
        if (cleanId) {
          const existing = map.get(cleanId.toLowerCase());
          map.set(cleanId.toLowerCase(), {
            adId: cleanId,
            productName: existing?.productName || prodKey.toUpperCase(),
            dailySpend: p.dailySpend || existing?.dailySpend,
            department: p.departments ? p.departments.join(', ') : existing?.department,
            departments: p.departments || existing?.departments,
            platform: p.platform || existing?.platform,
            imageUrl: p.imageUrl || existing?.imageUrl,
            lastDate: existing?.lastDate,
          });
        }
      }
    });

    return Array.from(map.values()).reverse(); // most recent first
  }, [dailyRecords]);

  // Detected ad based on current typed adId
  const detectedAd = useMemo(() => {
    const clean = adId.trim().replace(/^#/, '').toLowerCase();
    if (!clean) return null;
    return registeredAds.find((a) => a.adId.toLowerCase() === clean) || null;
  }, [adId, registeredAds]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        deptDropdownRef.current &&
        !deptDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDeptDropdownOpen(false);
      }
      if (
        idContainerRef.current &&
        !idContainerRef.current.contains(event.target as Node)
      ) {
        setIsIdSuggestionsOpen(false);
      }
    };
    if (isDeptDropdownOpen || isIdSuggestionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDeptDropdownOpen, isIdSuggestionsOpen]);

  // Helper to extract month name from YYYY-MM-DD
  const getMonthNameFromDate = (dateStr: string): string => {
    if (!dateStr) return MONTH_NAMES[new Date().getMonth()];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return MONTH_NAMES[mIdx];
      }
    }
    return MONTH_NAMES[new Date().getMonth()];
  };

  // Populate data when editing or opening
  useEffect(() => {
    if (editingRecord) {
      const recDate = editingRecord.date || todayStr;
      setDate(recDate);
      setPlatform(editingRecord.platform || 'Meta Ads (FB / IG)');
      setProductName(editingRecord.defaultProduct || '');
      
      // Load preset or use existing adId
      const preset = getProductPreset(editingRecord.defaultProduct, dailyRecords);
      const defaultId = editingRecord.adId || preset.adId || getDefaultAdIdForProduct(editingRecord.defaultProduct, dailyRecords);
      setAdId(defaultId);
      
      setDailySpend(editingRecord.dailySpend !== undefined ? editingRecord.dailySpend.toString() : (preset.dailySpend || '25.00'));
      setSalesCount(editingRecord.salesCount !== undefined ? editingRecord.salesCount.toString() : '1');

      const resolved = resolveRecordPriceAndCost(editingRecord, products, pricingRecords);
      setUnitPrice(editingRecord.unitPrice !== undefined ? editingRecord.unitPrice.toString() : resolved.unitPrice.toFixed(2));
      setUnitCost(editingRecord.unitCost !== undefined ? editingRecord.unitCost.toString() : resolved.unitCost.toFixed(2));
      
      // Check matching catalog product
      const matched = products.find(
        (p) => p.name.trim().toLowerCase() === (editingRecord.defaultProduct || '').trim().toLowerCase()
      );
      setSelectedCatalogProductId(matched ? matched.id : 'custom');
      
      // Image resolution with fallback
      const resolvedImg = editingRecord.imageUrl || preset.imageUrl || matched?.imageUrl || (products.find((p) => p.imageUrl)?.imageUrl) || '';
      setImageUrl(resolvedImg);
      setNotes(editingRecord.notes || '');
      
      const depts = editingRecord.department
        ? editingRecord.department.split(',').map((d) => d.trim()).filter(Boolean)
        : (preset.departments && preset.departments.length > 0 ? preset.departments : ['Lima']);
      const finalDepts = depts.length > 0 ? depts : ['Lima'];
      setSelectedDepartments(finalDepts);
      setDepartment(finalDepts.join(', '));
    } else {
      const initialDate = todayStr;
      setDate(initialDate);
      setPlatform('Meta Ads (FB / IG)');
      
      const defaultP = products[0];
      const initialProdName = defaultP ? defaultP.name : 'Remix Denim Jeans';
      const preset = getProductPreset(initialProdName, dailyRecords);
      
      if (defaultP) {
        setSelectedCatalogProductId(defaultP.id);
        setProductName(defaultP.name);
        setImageUrl(defaultP.imageUrl || preset.imageUrl || '');
      } else {
        setSelectedCatalogProductId('custom');
        setProductName(initialProdName);
        setImageUrl(preset.imageUrl || '');
      }
      
      const resolved = resolveRecordPriceAndCost({ defaultProduct: initialProdName }, products, pricingRecords);
      setUnitPrice(resolved.unitPrice.toFixed(2));
      setUnitCost(resolved.unitCost.toFixed(2));

      // Auto-assign predetermined Meta Ad ID & preferences from saved memory
      setAdId(preset.adId || generateMetaAdId(initialProdName));
      setDailySpend(preset.dailySpend || '25.00');
      const initialDepts = preset.departments && preset.departments.length > 0 ? preset.departments : ['Lima'];
      setSelectedDepartments(initialDepts);
      setDepartment(initialDepts.join(', '));
      setSalesCount('1');
      setNotes('');
    }
  }, [editingRecord, isOpen, todayStr, products, dailyRecords, pricingRecords]);

  // When selecting a catalog product from dropdown
  const handleCatalogProductChange = (productId: string) => {
    setSelectedCatalogProductId(productId);
    if (productId === 'custom') {
      return;
    }
    const matched = products.find((p) => p.id === productId);
    if (matched) {
      setProductName(matched.name);
      const preset = getProductPreset(matched.name, dailyRecords);
      
      if (matched.imageUrl) {
        setImageUrl(matched.imageUrl);
      } else if (preset.imageUrl) {
        setImageUrl(preset.imageUrl);
      }

      // Update with the product's saved or default Meta Ad ID and preferences
      setAdId(preset.adId || getDefaultAdIdForProduct(matched.name, dailyRecords));
      if (preset.departments && preset.departments.length > 0) {
        setSelectedDepartments(preset.departments);
        setDepartment(preset.departments.join(', '));
      }
      if (preset.dailySpend) {
        setDailySpend(preset.dailySpend);
      }

      const res = resolveRecordPriceAndCost({ defaultProduct: matched.name }, products, pricingRecords);
      setUnitPrice(res.unitPrice.toFixed(2));
      setUnitCost(res.unitCost.toFixed(2));
    }
  };

  const handleCustomProductNameChange = (val: string) => {
    setProductName(val);
    const matched = products.find(
      (p) => p.name.trim().toLowerCase() === val.trim().toLowerCase() ||
             (val.trim().length >= 3 && p.name.toLowerCase().includes(val.trim().toLowerCase()))
    );
    if (matched) {
      setSelectedCatalogProductId(matched.id);
      if (matched.imageUrl && !imageUrl) {
        setImageUrl(matched.imageUrl);
      }
    } else {
      setSelectedCatalogProductId('custom');
    }
    const preset = getProductPreset(val, dailyRecords);
    if (preset.adId) {
      setAdId(preset.adId);
    }
    if (preset.departments && preset.departments.length > 0) {
      setSelectedDepartments(preset.departments);
      setDepartment(preset.departments.join(', '));
    }
    const res = resolveRecordPriceAndCost({ defaultProduct: val }, products, pricingRecords);
    setUnitPrice(res.unitPrice.toFixed(2));
    setUnitCost(res.unitCost.toFixed(2));
  };

  const handleToggleDepartment = (dept: string) => {
    let updated: string[];
    if (selectedDepartments.includes(dept)) {
      updated = selectedDepartments.filter((d) => d !== dept);
    } else {
      updated = [...selectedDepartments, dept];
    }
    setSelectedDepartments(updated);
    setDepartment(updated.join(', '));
  };

  const handleSelectAllDepartments = () => {
    setSelectedDepartments([...PERU_25_DEPARTMENTS]);
    setDepartment(PERU_25_DEPARTMENTS.join(', '));
  };

  const handleSelectLimaOnly = () => {
    setSelectedDepartments(['Lima']);
    setDepartment('Lima');
  };

  const handleClearDepartments = () => {
    setSelectedDepartments([]);
    setDepartment('');
  };

  const handleSelectRegisteredAd = (item: {
    adId: string;
    productName: string;
    dailySpend?: string;
    department?: string;
    departments?: string[];
    platform?: string;
    imageUrl?: string;
  }) => {
    setAdId(item.adId);
    if (item.productName) {
      setProductName(item.productName);
      const matched = products.find(
        (p) => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase() ||
               (item.productName.trim().length >= 3 && p.name.toLowerCase().includes(item.productName.trim().toLowerCase()))
      );
      if (matched) {
        setSelectedCatalogProductId(matched.id);
        if (!item.imageUrl && matched.imageUrl) {
          setImageUrl(matched.imageUrl);
        }
      } else {
        setSelectedCatalogProductId('custom');
      }
    }
    if (item.imageUrl) {
      setImageUrl(item.imageUrl);
    }
    if (item.dailySpend) {
      setDailySpend(item.dailySpend);
    }
    if (item.platform) {
      setPlatform(item.platform);
    }
    if (item.departments && item.departments.length > 0) {
      setSelectedDepartments(item.departments);
      setDepartment(item.departments.join(', '));
    } else if (item.department) {
      const depts = item.department.split(',').map((d) => d.trim()).filter(Boolean);
      setSelectedDepartments(depts.length > 0 ? depts : ['Lima']);
      setDepartment(item.department);
    }
    setIsIdSuggestionsOpen(false);
  };

  const handleAdIdChange = (val: string) => {
    const clean = val.replace(/^#/, '').trim();
    setAdId(clean);

    // Auto-detect if entered ID matches any registered ad
    const matched = registeredAds.find(
      (a) => a.adId.toLowerCase() === clean.toLowerCase()
    );
    if (matched) {
      if (matched.productName) {
        setProductName(matched.productName);
        const cat = products.find(
          (p) => p.name.trim().toLowerCase() === matched.productName.trim().toLowerCase() ||
                 (matched.productName.trim().length >= 3 && p.name.toLowerCase().includes(matched.productName.trim().toLowerCase()))
        );
        if (cat) {
          setSelectedCatalogProductId(cat.id);
          if (!matched.imageUrl && cat.imageUrl) {
            setImageUrl(cat.imageUrl);
          }
        } else {
          setSelectedCatalogProductId('custom');
        }
      }
      if (matched.imageUrl) {
        setImageUrl(matched.imageUrl);
      }
      if (matched.dailySpend) {
        setDailySpend(matched.dailySpend);
      }
      if (matched.platform) {
        setPlatform(matched.platform);
      }
      if (matched.departments && matched.departments.length > 0) {
        setSelectedDepartments(matched.departments);
        setDepartment(matched.departments.join(', '));
      } else if (matched.department) {
        const depts = matched.department.split(',').map((d) => d.trim()).filter(Boolean);
        setSelectedDepartments(depts.length > 0 ? depts : ['Lima']);
        setDepartment(matched.department);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const spendNum = parseFloat(dailySpend) || 0;
    const salesNum = parseInt(salesCount, 10) || 0;
    const calculatedCPA = salesNum > 0 ? spendNum / salesNum : 0;
    const finalMonth = getMonthNameFromDate(date);

    const matchedProd = products.find(
      (p) => p.name.trim().toLowerCase() === productName.trim().toLowerCase() ||
             (productName.trim().length >= 3 && p.name.toLowerCase().includes(productName.trim().toLowerCase()))
    );
    const resolvedImageUrl = imageUrl || matchedProd?.imageUrl || undefined;

    const finalAdId = adId.trim() || getDefaultAdIdForProduct(productName, dailyRecords);
    const finalDepts = selectedDepartments.length > 0 ? selectedDepartments : ['Lima'];
    const finalDepartment = finalDepts.join(', ');

    const parsedUnitPrice = parseFloat(unitPrice) || 0;
    const parsedUnitCost = parseFloat(unitCost) || 0;

    // Persist this configuration automatically for future uses
    saveProductAdPreset(productName.trim(), {
      adId: finalAdId,
      departments: finalDepts,
      dailySpend: spendNum > 0 ? spendNum.toFixed(2) : '25.00',
      platform: platform || 'Meta Ads (FB / IG)',
      imageUrl: resolvedImageUrl,
      unitPrice: parsedUnitPrice > 0 ? parsedUnitPrice : undefined,
      unitCost: parsedUnitCost > 0 ? parsedUnitCost : undefined,
    });

    const newRecord: DailySaleRecord = {
      id: editingRecord ? editingRecord.id : `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: date || todayStr,
      month: finalMonth,
      platform: platform || 'Meta Ads (FB / IG)',
      defaultProduct: productName.trim() || 'Prenda / Producto WhatsApp',
      adId: finalAdId,
      dailySpend: parseFloat(spendNum.toFixed(2)),
      salesCount: salesNum,
      unitPrice: parsedUnitPrice > 0 ? parsedUnitPrice : undefined,
      unitCost: parsedUnitCost > 0 ? parsedUnitCost : undefined,
      cpa: parseFloat(calculatedCPA.toFixed(2)),
      department: finalDepartment,
      imageUrl: resolvedImageUrl,
      notes: notes.trim() || undefined,
    };

    onSave(newRecord);
    onClose();
  };

  // Live estimated stats for preview
  const spendFloat = parseFloat(dailySpend) || 0;
  const salesInt = parseInt(salesCount, 10) || 0;
  const unitPriceFloat = parseFloat(unitPrice) || 0;
  const unitCostFloat = parseFloat(unitCost) || 0;
  const liveCPA = salesInt > 0 ? spendFloat / salesInt : 0;
  
  const estRev = salesInt * unitPriceFloat;
  const estROAS = spendFloat > 0 ? estRev / spendFloat : 0;
  const estProfit = estRev - spendFloat - (salesInt * unitCostFloat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Fixed Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {editingRecord ? 'Editar Anuncio & Ventas' : 'Registrar Nuevo Anuncio & Ventas'}
              </h3>
              <p className="text-xs text-slate-400">
                Gasto de publicidad, ventas por WhatsApp y métricas de rendimiento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="meta-ad-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Fields (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Product Selection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span>Producto o Prenda</span>
                  </span>
                  {selectedCatalogProductId !== 'custom' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                      Inventario Enlazado
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] text-slate-600 font-semibold block mb-1">Catálogo:</span>
                    <select
                      value={selectedCatalogProductId}
                      onChange={(e) => handleCatalogProductChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                    >
                      <option value="custom">✏️ Nombre personalizado...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (S/ {p.salePrice.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-600 font-semibold block mb-1">Nombre para el Anuncio:</span>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Jean Cargo Oversized"
                      value={productName}
                      onChange={(e) => handleCustomProductNameChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Month badge, ID & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fecha</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-black font-mono focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                  />
                </div>

                <div className="relative" ref={idContainerRef}>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-cyan-600" />
                      <span>ID de Anuncio</span>
                    </label>
                    {detectedAd ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[170px]" title={`Auto-detectado: ${detectedAd.productName}`}>
                        ✓ Detectado: {detectedAd.productName}
                      </span>
                    ) : registeredAds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setIsIdSuggestionsOpen(!isIdSuggestionsOpen)}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ver lista de IDs ya registrados"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>IDs Registrados ({registeredAds.length})</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-mono font-bold text-slate-400 select-none">
                      #
                    </span>
                    <input
                      type="text"
                      list="meta-registered-ids"
                      placeholder="12028491038"
                      value={adId}
                      onChange={(e) => handleAdIdChange(e.target.value)}
                      onFocus={() => {
                        if (registeredAds.length > 0) {
                          setIsIdSuggestionsOpen(true);
                        }
                      }}
                      className={`w-full bg-white border ${
                        detectedAd ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-300'
                      } text-slate-900 pl-7 pr-8 py-2 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500 shadow-2xs`}
                    />
                    {registeredAds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsIdSuggestionsOpen(!isIdSuggestionsOpen)}
                        className="absolute right-2 text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                        title="Desplegar IDs guardados"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isIdSuggestionsOpen ? 'rotate-180 text-blue-600' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Native Datalist for automatic browser autocomplete */}
                  <datalist id="meta-registered-ids">
                    {registeredAds.map((item) => (
                      <option key={item.adId} value={item.adId}>
                        {item.productName} (S/ {item.dailySpend || '25.00'})
                      </option>
                    ))}
                  </datalist>

                  {/* Interactive Floating Menu with all Registered IDs */}
                  {isIdSuggestionsOpen && registeredAds.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-300 rounded-xl shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto animate-fadeIn">
                      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-500">
                        <span>IDs Registrados ({registeredAds.length})</span>
                        <span className="text-slate-400 font-normal">Clic para cargar datos</span>
                      </div>
                      <div className="space-y-1 pt-1">
                        {registeredAds.map((item) => {
                          const isCurrent = adId.toLowerCase() === item.adId.toLowerCase();
                          return (
                            <button
                              key={item.adId}
                              type="button"
                              onClick={() => handleSelectRegisteredAd(item)}
                              className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
                                isCurrent
                                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                                  : 'bg-slate-50/70 border-slate-200/60 hover:bg-blue-50/50 hover:border-blue-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    #
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-blue-700 text-[11px]">
                                      #{item.adId}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.2 rounded">
                                        Seleccionado
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] font-semibold text-slate-700 truncate">
                                    {item.productName}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {item.dailySpend && (
                                  <span className="text-[10px] font-bold text-slate-900 block">
                                    S/ {item.dailySpend}
                                  </span>
                                )}
                                {item.department && (
                                  <span className="text-[9px] text-slate-500 block truncate max-w-[90px]">
                                    {item.department}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plataforma Publicitaria
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="Meta Ads (FB / IG)">Meta Ads (Facebook & Instagram)</option>
                  <option value="TikTok Ads">TikTok Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="WhatsApp Directo">WhatsApp Directo / Orgánico</option>
                </select>
              </div>

              {/* Spend & Sales Count Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gradient-to-r from-blue-50/90 to-emerald-50/90 p-4 rounded-2xl border border-blue-200">
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>Gasto Publicidad (S/)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={dailySpend}
                      onChange={(e) => setDailySpend(e.target.value)}
                      className="w-full bg-white border border-blue-300 text-slate-900 pl-8 pr-3 py-1.5 rounded-xl text-sm font-black font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Ventas por WhatsApp</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={salesCount}
                    onChange={(e) => setSalesCount(e.target.value)}
                    className="w-full bg-white border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl text-sm font-black font-mono focus:outline-none focus:border-emerald-600 shadow-2xs"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Unit Price & Unit Cost Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Precio Venta Unitario (S/)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">por combo/prenda</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 pl-8 pr-3 py-1.5 rounded-xl text-sm font-black font-mono focus:outline-none focus:border-emerald-500 shadow-2xs"
                      placeholder="99.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Costo Unitario Prenda (S/)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">costo compra/fab</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 pl-8 pr-3 py-1.5 rounded-xl text-sm font-black font-mono focus:outline-none focus:border-indigo-500 shadow-2xs"
                      placeholder="30.00"
                    />
                  </div>
                </div>
              </div>

              {/* Targeting Departments - 25 Departamentos del Perú con Selección Múltiple y Desplegable */}
              <div className="relative" ref={deptDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Departamentos de Destino</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {selectedDepartments.length === PERU_25_DEPARTMENTS.length
                      ? 'Nacional (25)'
                      : `${selectedDepartments.length} de 25`}
                  </span>
                </div>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                  className={`w-full bg-white border ${
                    isDeptDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300'
                  } text-slate-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs hover:border-slate-400 transition-all text-left cursor-pointer`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate font-semibold text-slate-800">
                      {selectedDepartments.length === 0
                        ? 'Seleccionar departamentos...'
                        : selectedDepartments.length === PERU_25_DEPARTMENTS.length
                        ? 'Todo el Perú (25 departamentos)'
                        : selectedDepartments.length <= 2
                        ? selectedDepartments.join(', ')
                        : `${selectedDepartments.slice(0, 2).join(', ')} (+${selectedDepartments.length - 2} más)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedDepartments.length === PERU_25_DEPARTMENTS.length
                        ? 'Todo el Perú'
                        : `${selectedDepartments.length} marcados`}
                    </span>
                    {isDeptDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Dropdown Floating Menu with Checkboxes */}
                {isDeptDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-300 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-fadeIn">
                    {/* Quick Selection Actions */}
                    <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">
                        Marcar departamentos:
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={handleSelectLimaOnly}
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-colors cursor-pointer"
                        >
                          Solo Lima
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectAllDepartments}
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-colors cursor-pointer"
                        >
                          Todo el Perú
                        </button>
                        <button
                          type="button"
                          onClick={handleClearDepartments}
                          className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors cursor-pointer"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    {/* Filter Search inside Dropdown */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar departamento..."
                        value={deptSearchQuery}
                        onChange={(e) => setDeptSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Checkboxes 25 Departments Grid */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                      {PERU_25_DEPARTMENTS.filter((dept) =>
                        dept.toLowerCase().includes(deptSearchQuery.trim().toLowerCase())
                      ).map((dept) => {
                        const isChecked = selectedDepartments.includes(dept);
                        return (
                          <label
                            key={dept}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-colors border ${
                              isChecked
                                ? 'bg-blue-50 border-blue-200 text-blue-900'
                                : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleDepartment(dept)}
                              className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                            <span className="truncate">{dept}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Bottom Done Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600">
                        {selectedDepartments.length} departamento{selectedDepartments.length === 1 ? '' : 's'} seleccionado{selectedDepartments.length === 1 ? '' : 's'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDeptDropdownOpen(false)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        Listo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Anuncio con video de prueba, segmentación 20 a 35 años..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

            </div>

            {/* Right Column: Creative Image Upload & Metrics Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Dropzone Image Uploader */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Imagen / Creativo</span>
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>

                <ImageDropzone
                  currentImage={imageUrl}
                  onImageSelected={(b64) => setImageUrl(b64)}
                  heightClass="h-44"
                  compact={true}
                />
              </div>

              {/* Performance Preview Card */}
              <div className="bg-slate-900 rounded-2xl p-4 text-white border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Resumen Estimado
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                    <span className="text-emerald-400">P: S/ {unitPriceFloat.toFixed(2)}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-300">C: S/ {unitCostFloat.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Gasto</span>
                    <span className="font-mono font-bold text-cyan-400 text-xs">
                      S/ {spendFloat.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Ventas</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {salesInt}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">CPA</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      S/ {liveCPA.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">ROAS</span>
                    <span className={`font-mono font-black text-xs ${
                      estROAS >= 3.0 ? 'text-emerald-400' : estROAS >= 2.0 ? 'text-blue-400' : 'text-rose-400'
                    }`}>
                      {estROAS.toFixed(2)}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-slate-300">
                  <span>Facturación: <strong className="text-white font-mono">S/ {estRev.toFixed(2)}</strong></span>
                  <span>Beneficio: <strong className={`font-mono ${estProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>S/ {estProfit.toFixed(2)}</strong></span>
                </div>
              </div>

            </div>
          </div>
        </form>

        {/* Fixed Footer with Action Buttons */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="meta-ad-form"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{editingRecord ? 'Guardar Cambios' : 'Registrar Anuncio'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

