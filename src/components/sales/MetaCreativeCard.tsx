import React, { useRef, useState, useMemo } from 'react';
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
  Flame,
  Plus,
  Minus,
  Copy,
  Check,
  TrendingUp,
  X,
  Search,
} from 'lucide-react';
import { DailySaleRecord, Product } from '../../types';
import { compressImage } from '../../lib/imageUtils';
import { getDefaultAdIdForProduct, saveProductAdPreset } from '../../lib/adUtils';
import { PERU_25_DEPARTMENTS } from './MetaGroupedCreativeCard';

interface MetaCreativeCardProps {
  record: DailySaleRecord;
  products: Product[];
  todayStr: string;
  isRecentlyAdded: boolean;
  onUpdateRecord: (record: DailySaleRecord) => void;
  onStartEdit: (record: DailySaleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onViewImage: (imageUrl: string, record: DailySaleRecord) => void;
  onDuplicateForToday?: (record: DailySaleRecord) => void;
}

export const MetaCreativeCard: React.FC<MetaCreativeCardProps> = ({
  record,
  products,
  todayStr,
  isRecentlyAdded,
  onUpdateRecord,
  onStartEdit,
  onDeleteRecord,
  onViewImage,
  onDuplicateForToday,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingSpend, setIsEditingSpend] = useState(false);
  const [spendInput, setSpendInput] = useState(record.dailySpend.toString());
  const [isEditingSales, setIsEditingSales] = useState(false);
  const [salesInput, setSalesInput] = useState(record.salesCount.toString());
  const [copiedId, setCopiedId] = useState(false);
  const [isEditingAdId, setIsEditingAdId] = useState(false);
  const [adIdInput, setAdIdInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isAddingDeptOpen, setIsAddingDeptOpen] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [customDeptInput, setCustomDeptInput] = useState('');

  const isToday = record.date === todayStr;

  // Departments for this record
  const departments = record.department
    ? record.department.split(',').map((d) => d.trim()).filter(Boolean)
    : [];

  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const filteredDepartments = useMemo(() => {
    if (!deptSearchQuery.trim()) return PERU_25_DEPARTMENTS;
    const q = normalizeText(deptSearchQuery);
    return PERU_25_DEPARTMENTS.filter((dept) => normalizeText(dept).includes(q));
  }, [deptSearchQuery]);

  const handleToggleDepartment = (deptName: string) => {
    const isPresent = departments.includes(deptName);
    const updatedList = isPresent
      ? departments.filter((d) => d !== deptName)
      : [...departments, deptName];
    onUpdateRecord({
      ...record,
      department: updatedList.join(', '),
    });
  };

  const handleAddCustomDept = () => {
    const clean = customDeptInput.trim();
    if (!clean) return;
    handleToggleDepartment(clean);
    setCustomDeptInput('');
  };

  const handleRemoveDepartment = (deptName: string) => {
    const updatedList = departments.filter((d) => d !== deptName);
    onUpdateRecord({
      ...record,
      department: updatedList.join(', '),
    });
  };

  // Find matching product in catalog to get sale price & image fallback
  const cleanProductName = (record.defaultProduct || '').trim().toLowerCase();
  const matchedProduct =
    products.find((p) => p.name.trim().toLowerCase() === cleanProductName) ||
    products.find(
      (p) =>
        cleanProductName.length >= 3 &&
        (p.name.toLowerCase().includes(cleanProductName) || cleanProductName.includes(p.name.toLowerCase()))
    ) ||
    products.find((p) => p.imageUrl) ||
    products[0];

  const displayImage = record.imageUrl || matchedProduct?.imageUrl || products.find((p) => p.imageUrl)?.imageUrl;
  const salePrice = matchedProduct?.salePrice || 79.0;
  const estRevenue = record.salesCount * salePrice;
  const roas = record.dailySpend > 0 ? estRevenue / record.dailySpend : 0;

  // Quick increment/decrement sales
  const handleDeltaSales = (delta: number) => {
    const newCount = Math.max(0, (record.salesCount || 0) + delta);
    const calculatedCPA = newCount > 0 ? record.dailySpend / newCount : 0;
    const updated: DailySaleRecord = {
      ...record,
      salesCount: newCount,
      cpa: parseFloat(calculatedCPA.toFixed(2)),
    };
    onUpdateRecord(updated);
  };

  const handleSaveInlineSpend = () => {
    const parsed = parseFloat(spendInput);
    const newSpend = !isNaN(parsed) && parsed >= 0 ? parsed : record.dailySpend;
    const calculatedCPA = record.salesCount > 0 ? newSpend / record.salesCount : 0;
    const updated: DailySaleRecord = {
      ...record,
      dailySpend: parseFloat(newSpend.toFixed(2)),
      cpa: parseFloat(calculatedCPA.toFixed(2)),
    };
    onUpdateRecord(updated);
    setIsEditingSpend(false);
  };

  const handleSaveInlineSales = () => {
    const parsed = parseInt(salesInput, 10);
    const newSales = !isNaN(parsed) && parsed >= 0 ? parsed : record.salesCount;
    const calculatedCPA = newSales > 0 ? record.dailySpend / newSales : 0;
    const updated: DailySaleRecord = {
      ...record,
      salesCount: newSales,
      cpa: parseFloat(calculatedCPA.toFixed(2)),
    };
    onUpdateRecord(updated);
    setIsEditingSales(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const base64 = await compressImage(file);
      onUpdateRecord({
        ...record,
        imageUrl: base64,
      });
    } catch (err) {
      console.error('Error cargando imagen:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const effectiveAdId = record.adId || getDefaultAdIdForProduct(record.defaultProduct);

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

    saveProductAdPreset(record.defaultProduct, { adId: cleanId });
    onUpdateRecord({
      ...record,
      adId: cleanId,
    });
    setIsEditingAdId(false);
  };

  // Format date parts for big readable display
  const formatDateLarge = (dateStr: string) => {
    if (!dateStr) return { formatted: '', readable: '', fullMonth: '' };
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const shortMonths = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const mIdx = parseInt(month, 10) - 1;
      const shortM = shortMonths[mIdx] || month;
      const fullM = monthNames[mIdx] || month;
      return {
        formatted: `${day}/${month}/${year}`,
        readable: `${day} ${shortM} ${year}`,
        fullMonth: fullM,
      };
    }
    return { formatted: dateStr, readable: dateStr, fullMonth: '' };
  };

  const dateInfo = formatDateLarge(record.date);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm flex flex-col overflow-hidden group ${
        isRecentlyAdded
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10'
          : isToday
          ? 'border-blue-300 ring-1 ring-blue-500/10 hover:border-blue-400 hover:shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* 1. Header: Meta Ads Bar with Big Date & On/Off Toggle */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 shrink-0">
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Big Visible Date */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">
              {dateInfo.formatted || record.date}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden xs:inline">
              ({record.month || dateInfo.fullMonth})
            </span>
          </div>

          {isToday && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wide shrink-0 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-ping" />
              <span>HOY</span>
            </span>
          )}
        </div>

        {/* On/Off Switch Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              isActive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            title={isActive ? 'Anuncio Activo' : 'Anuncio Pausado'}
          >
            <span
              className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform shadow-xs ${
                isActive ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Image / Creative Showcase (Meta Ad Feed Style) */}
      <div className="relative bg-slate-950 aspect-4/3 w-full flex items-center justify-center overflow-hidden border-b border-slate-100">
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={record.defaultProduct}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Quick Action Buttons over image */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onViewImage(displayImage, record)}
                className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg backdrop-blur-xs transition-transform active:scale-95 shadow-md cursor-pointer"
                title="Ampliar creativo en pantalla completa"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-black/60 hover:bg-blue-600 text-white rounded-lg backdrop-blur-xs transition-transform active:scale-95 shadow-md cursor-pointer"
                title="Cambiar imagen del anuncio"
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
              {record.defaultProduct}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Subir Creativo</span>
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

        {/* Ad ID Badge Over Image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          {isEditingAdId ? (
            <div className="flex items-center gap-1 bg-black/90 p-1 rounded-lg border border-cyan-400 backdrop-blur-xs" onClick={(e) => e.stopPropagation()}>
              <span className="text-cyan-400 font-mono text-[11px] font-bold pl-1">#</span>
              <input
                type="text"
                autoFocus
                value={adIdInput}
                onChange={(e) => setAdIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAdId();
                  if (e.key === 'Escape') setIsEditingAdId(false);
                }}
                className="w-24 px-1.5 py-0.5 bg-slate-800 border border-cyan-400 rounded text-xs font-mono font-bold text-cyan-200 focus:outline-none"
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
            <div className="inline-flex items-center gap-1 bg-black/80 rounded-lg border border-cyan-500/40 backdrop-blur-xs pr-1">
              <button
                type="button"
                onClick={handleCopyAdId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-cyan-300 hover:text-cyan-100 text-xs font-mono font-bold transition-colors cursor-pointer"
                title="Haz clic para copiar ID del anuncio"
              >
                <Tag className="w-3 h-3 text-cyan-400" />
                <span>#{effectiveAdId}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-2.5 h-2.5 text-cyan-400 opacity-60" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdIdInput(effectiveAdId);
                  setIsEditingAdId(true);
                }}
                className="p-1 text-slate-400 hover:text-amber-300 hover:bg-white/10 rounded transition-colors cursor-pointer"
                title="Editar solo el ID del anuncio"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {isUploadingImage && (
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold animate-pulse">
              Subiendo...
            </span>
          )}
        </div>
      </div>

      {/* 3. Product & Location Info */}
      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2" title={record.defaultProduct}>
              {record.defaultProduct}
            </h4>
          </div>

          {/* Departments Tag & Quick Add */}
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Departamento / Ubicación:</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingDeptOpen(!isAddingDeptOpen)}
                title={departments.length === 0 ? 'Agregar departamento' : 'Modificar departamentos'}
                aria-label="Agregar o modificar departamento"
                className="p-1 font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-white border border-rose-200 px-1.5 py-0.5 rounded shadow-2xs"
                  >
                    <span>📍 {dept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(dept)}
                      className="text-rose-400 hover:text-rose-700 ml-0.5 cursor-pointer"
                      title={`Quitar ${dept}`}
                    >
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Sin departamento asignado
                </span>
              )}
            </div>

            {/* Quick Department Selector Panel (when open) */}
            {isAddingDeptOpen && (
              <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-md space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10.5px] font-bold text-slate-700">
                    Seleccionar Departamento ({record.date}):
                  </div>
                  {departments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateRecord({
                          ...record,
                          department: '',
                        });
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline decoration-dotted"
                    >
                      Limpiar ({departments.length})
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
                        const isSelected = departments.includes(dept);
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
                    {departments.length} {departments.length === 1 ? 'seleccionado' : 'seleccionados'}
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
        </div>

        {/* 4. Live WhatsApp Sales Counter Box */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1 text-slate-700">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Resultados (Ventas WhatsApp)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              1 toque = +1 venta
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Minus 1 Button */}
            <button
              type="button"
              onClick={() => handleDeltaSales(-1)}
              disabled={record.salesCount <= 0}
              className="w-10 h-10 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 hover:border-rose-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Restar 1 venta"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Sales Count Display & Direct Edit */}
            {isEditingSales ? (
              <div className="flex items-center gap-1 flex-1">
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
                  className="w-full text-center text-xl font-black font-mono bg-white border-2 border-emerald-500 rounded-lg py-1 text-emerald-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveInlineSales}
                  className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  ✓
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSalesInput(record.salesCount.toString());
                  setIsEditingSales(true);
                }}
                className="relative flex-1 text-center py-1 rounded-lg hover:bg-emerald-50/60 transition-colors group/count cursor-pointer"
                title="Haz clic para escribir número exacto de ventas"
              >
                <div className="text-2xl font-black font-mono text-emerald-700 leading-none">
                  {record.salesCount}
                </div>
                <span className="text-[10px] text-slate-400 group-hover/count:text-emerald-700 transition-colors">
                  pedidos cerrados
                </span>
              </button>
            )}

            {/* Plus 1 Button */}
            <button
              type="button"
              onClick={() => handleDeltaSales(1)}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              title="Sumar +1 venta ahora"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="text-xs font-black">+1 Venta</span>
            </button>
          </div>
        </div>

        {/* 5. Meta Ads Performance Metrics Matrix (Gasto, CPA, Ingresos, ROAS) */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          {/* Gasto Publicitario */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Importe Gastado
            </span>
            {isEditingSpend ? (
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
              <button
                type="button"
                onClick={() => {
                  setSpendInput(record.dailySpend.toString());
                  setIsEditingSpend(true);
                }}
                className="font-black font-mono text-slate-900 text-sm hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                title="Haz clic para editar gasto diario"
              >
                <span>S/ {record.dailySpend.toFixed(2)}</span>
                <Edit2 className="w-2.5 h-2.5 opacity-40 hover:opacity-100" />
              </button>
            )}
          </div>

          {/* CPA Real */}
          <div
            className={`p-2.5 rounded-xl border ${
              record.salesCount === 0
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : record.cpa <= 10
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : record.cpa <= 20
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span className="text-[10px] font-bold uppercase block mb-1">
              Costo / Venta (CPA)
            </span>
            <span className="font-black font-mono text-sm block">
              {record.salesCount > 0 ? `S/ ${record.cpa.toFixed(2)}` : 'S/ 0.00'}
            </span>
          </div>

          {/* Facturación Estimada */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
              Valor de Conversión
            </span>
            <span className="font-black font-mono text-sm text-indigo-700 block">
              S/ {estRevenue.toFixed(2)}
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
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onStartEdit(record)}
            className="px-2.5 py-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 bg-slate-100/90 hover:border-blue-300 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs"
            title="Editar todos los campos"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Editar Todo</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteRecord(record.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Eliminar este registro"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
