import React, { useState, useMemo } from 'react';
import { DailySaleRecord, Product, PricingCalculationRecord } from '../types';
import { MetaAdsHeader, MetaAdsTabLevel, MetaDatePreset } from './sales/MetaAdsHeader';
import { MetaGroupedCreativeCard, GroupedCreative } from './sales/MetaGroupedCreativeCard';
import { MetaAdsTable } from './sales/MetaAdsTable';
import { MetaAdsCharts } from './sales/MetaAdsCharts';
import { MetaAdModal } from './sales/MetaAdModal';
import { ImageLightboxModal } from './sales/ImageLightboxModal';
import {
  getDefaultAdIdForProduct,
  resolveRecordPriceAndCost,
  getLocalDateString,
  getYesterdayDateString
} from '../lib/adUtils';
import { Plus, LayoutGrid, List, Sparkles } from 'lucide-react';

interface SalesViewProps {
  products: Product[];
  dailyRecords: DailySaleRecord[];
  pricingRecords?: PricingCalculationRecord[];
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
  onAddDailyRecord: (record: DailySaleRecord) => void;
  onUpdateDailyRecord?: (record: DailySaleRecord) => void;
  onDeleteDailyRecord: (id: string) => void;
  onDeleteBulkDailyRecords: (ids: string[]) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  products,
  dailyRecords,
  pricingRecords = [],
  isSyncing = false,
  lastSyncTime,
  onManualSync,
  onAddDailyRecord,
  onUpdateDailyRecord,
  onDeleteDailyRecord,
  onDeleteBulkDailyRecords,
}) => {
  // Navigation level tab (Creative Hub / Table / Charts) - Default: creative_hub (Muro Visual)
  const [currentTab, setCurrentTab] = useState<MetaAdsTabLevel>('creative_hub');

  // Date Boundaries reliably in local timezone
  const getDateRange = () => {
    const today = new Date();
    const todayFormatted = getLocalDateString(today);
    const yesterdayFormatted = getYesterdayDateString(today);

    const last7 = new Date(today);
    last7.setDate(last7.getDate() - 7);
    const last7Formatted = getLocalDateString(last7);

    const last14 = new Date(today);
    last14.setDate(last14.getDate() - 14);
    const last14Formatted = getLocalDateString(last14);

    const last30 = new Date(today);
    last30.setDate(last30.getDate() - 30);
    const last30Formatted = getLocalDateString(last30);

    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const thisMonthPrefix = `${currentYear}-${currentMonth}`;

    return {
      todayFormatted,
      yesterdayFormatted,
      last7Formatted,
      last14Formatted,
      last30Formatted,
      thisMonthPrefix,
    };
  };

  const dates = getDateRange();
  const todayStr = dates.todayFormatted;

  // Date Range Filter State
  const [selectedSpecificDate, setSelectedSpecificDate] = useState<string>(todayStr);
  const [datePreset, setDatePreset] = useState<MetaDatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailySaleRecord | null>(null);

  // Lightbox Modal state
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string | null;
    record: DailySaleRecord | null;
  }>({ imageUrl: null, record: null });

  // Recently added record id for highlight effect
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const handleDatePresetChange = (preset: MetaDatePreset) => {
    setDatePreset(preset);
    if (preset === 'today') {
      setSelectedSpecificDate(dates.todayFormatted);
    } else if (preset === 'yesterday') {
      setSelectedSpecificDate(dates.yesterdayFormatted);
    }
  };

  const handleSpecificDateChange = (newDate: string) => {
    setSelectedSpecificDate(newDate);
    if (newDate === dates.todayFormatted) {
      setDatePreset('today');
    } else if (newDate === dates.yesterdayFormatted) {
      setDatePreset('yesterday');
    } else {
      setDatePreset('specific_date');
    }
  };

  // Filter records based on selected date preset & search term
  const normalizeDate = (d?: string) => (d || '').split('T')[0].trim();

  const filteredRecords = dailyRecords.filter((rec) => {
    // 1. Date Filter
    let matchesDate = true;
    const recDate = normalizeDate(rec.date);
    if (datePreset === 'today') {
      matchesDate = recDate === normalizeDate(dates.todayFormatted);
    } else if (datePreset === 'yesterday') {
      matchesDate = recDate === normalizeDate(dates.yesterdayFormatted);
    } else if (datePreset === 'specific_date') {
      matchesDate = recDate === normalizeDate(selectedSpecificDate);
    } else if (datePreset === 'last_7_days') {
      matchesDate = recDate >= dates.last7Formatted && recDate <= dates.todayFormatted;
    } else if (datePreset === 'last_14_days') {
      matchesDate = recDate >= dates.last14Formatted && recDate <= dates.todayFormatted;
    } else if (datePreset === 'last_30_days') {
      matchesDate = recDate >= dates.last30Formatted && recDate <= dates.todayFormatted;
    } else if (datePreset === 'this_month') {
      matchesDate = recDate.startsWith(dates.thisMonthPrefix);
    } else if (datePreset === 'custom') {
      matchesDate = recDate >= customStartDate && recDate <= customEndDate;
    } else if (datePreset === 'all') {
      matchesDate = true;
    }

    // 2. Search Filter
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      matchesSearch =
        rec.defaultProduct.toLowerCase().includes(q) ||
        (rec.adId && rec.adId.toLowerCase().includes(q)) ||
        (rec.department && rec.department.toLowerCase().includes(q)) ||
        recDate.includes(q) ||
        (rec.notes && rec.notes.toLowerCase().includes(q));
    }

    return matchesDate && matchesSearch;
  });

  // Calculate Overall Meta KPI Totals
  const totalSpend = filteredRecords.reduce((sum, r) => sum + (Number(r.dailySpend) || 0), 0);
  const totalSales = filteredRecords.reduce((sum, r) => sum + (Number(r.salesCount) || 0), 0);
  const averageCPA = totalSales > 0 ? totalSpend / totalSales : 0;

  const totalRevenue = filteredRecords.reduce((sum, r) => {
    const res = resolveRecordPriceAndCost(r, products, pricingRecords);
    return sum + res.revenue;
  }, 0);

  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Group dailyRecords and products into unified creative cards
  // STRICT RULE: Unify by product name and Ad ID so all daily records (all dates)
  // for a product/creative stay synchronized together in a single card.
  const groupedCreatives = useMemo(() => {
    const groups: GroupedCreative[] = [];

    const normalizeDate = (d?: string) => (d || '').split('T')[0].trim();
    const normalizeName = (name?: string) => (name || '').trim().toLowerCase();
    const normalizeAdId = (id?: string) => (id || '').trim().replace(/^#/, '').toLowerCase();

    // Helper to find existing group for a record or product
    const findGroup = (prodName: string, adId?: string, imageUrl?: string) => {
      const cleanProd = normalizeName(prodName);
      const cleanId = normalizeAdId(adId);
      const cleanImg = (imageUrl || '').trim();

      // Priority 1: Match by Ad ID if a non-placeholder Meta Ad ID exists
      if (cleanId && !cleanId.startsWith('rec_') && !cleanId.startsWith('ad_') && !cleanId.startsWith('prod_')) {
        const matchById = groups.find(
          (g) => normalizeAdId(g.adId) === cleanId
        );
        if (matchById) return matchById;
      }

      // Priority 2: Match by Product Name
      if (cleanProd) {
        const matchByProd = groups.find(
          (g) => normalizeName(g.primaryProduct) === cleanProd
        );
        if (matchByProd) return matchByProd;
      }

      // Priority 3: Match by Image URL if valid
      if (cleanImg && !cleanImg.startsWith('data:')) {
        const matchByImg = groups.find((g) => (g.imageUrl || '').trim() === cleanImg);
        if (matchByImg) return matchByImg;
      }

      return undefined;
    };

    // 1. Process all daily sale records
    dailyRecords.forEach((record) => {
      const prodName = record.defaultProduct?.trim() || 'Producto General';
      const cleanAdId = (record.adId?.trim() || '').replace(/^#/, '').trim();
      const imageUrl = record.imageUrl?.trim() || undefined;

      let group = findGroup(prodName, cleanAdId, imageUrl);

      if (group) {
        // Add record if not already present
        if (!group.records.some((r) => r.id === record.id)) {
          group.records.push(record);
        }
        // Update image if missing
        if (!group.imageUrl && imageUrl) {
          group.imageUrl = imageUrl;
        }
        // If the record has a real Meta Ad ID (numbers or non-placeholder), update group's adId
        if (cleanAdId && !cleanAdId.startsWith('rec_') && !cleanAdId.startsWith('ad_')) {
          group.adId = cleanAdId;
        }
        // Ensure primaryProduct is set
        if (!group.primaryProduct && prodName) {
          group.primaryProduct = prodName;
        }
      } else {
        const newGroup: GroupedCreative = {
          key: `creative_${normalizeName(prodName).replace(/[^a-z0-9]/g, '_')}_${groups.length}`,
          primaryProduct: prodName,
          adId: cleanAdId || getDefaultAdIdForProduct(prodName, dailyRecords),
          imageUrl: imageUrl,
          records: [record],
        };
        groups.push(newGroup);
      }
    });

    // 2. Include catalog products that don't have records yet
    products.forEach((p) => {
      const prodName = p.name.trim();
      const catalogAdId = (p.sku?.trim() || getDefaultAdIdForProduct(prodName, dailyRecords))
        .replace(/^#/, '')
        .trim();
      const imageUrl = p.imageUrl?.trim() || undefined;

      let group = findGroup(prodName, catalogAdId, imageUrl);
      if (group) {
        if (!group.imageUrl && imageUrl) {
          group.imageUrl = imageUrl;
        }
        if ((!group.adId || group.adId.startsWith('rec_')) && catalogAdId) {
          group.adId = catalogAdId;
        }
      } else {
        const newGroup: GroupedCreative = {
          key: `cat_${normalizeName(prodName).replace(/[^a-z0-9]/g, '_')}_${groups.length}`,
          primaryProduct: prodName,
          adId: catalogAdId,
          imageUrl: imageUrl,
          records: [],
        };
        groups.push(newGroup);
      }
    });

    // 3. Post-process to ensure all groups have the most complete Ad ID and image
    groups.forEach((g) => {
      // If group adId is placeholder or empty, look inside its records
      if (!g.adId || g.adId.startsWith('rec_') || g.adId.startsWith('ad_')) {
        const recWithRealId = g.records.find(
          (r) => r.adId && !r.adId.startsWith('rec_') && !r.adId.startsWith('ad_')
        );
        if (recWithRealId?.adId) {
          g.adId = recWithRealId.adId.replace(/^#/, '').trim();
        } else {
          g.adId = getDefaultAdIdForProduct(g.primaryProduct, dailyRecords);
        }
      }

      // If group has no image, find one from records or catalog
      if (!g.imageUrl) {
        const recWithImg = g.records.find((r) => r.imageUrl);
        const prodMatch = products.find(
          (p) => normalizeName(p.name) === normalizeName(g.primaryProduct)
        );
        g.imageUrl = recWithImg?.imageUrl || prodMatch?.imageUrl;
      }

      // Sort records by date descending inside each creative group
      g.records.sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));
    });

    let list = groups;

    // Apply search filter if present
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.primaryProduct.toLowerCase().includes(q) ||
          c.adId.toLowerCase().includes(q) ||
          c.records.some((r) => (r.department || '').toLowerCase().includes(q))
      );
    }

    // Sort cards by most recent record date / highest sales
    return list.sort((a, b) => {
      const salesA = a.records.reduce((s, r) => s + (Number(r.salesCount) || 0), 0);
      const salesB = b.records.reduce((s, r) => s + (Number(r.salesCount) || 0), 0);
      if (salesB !== salesA) return salesB - salesA;
      const latestDateA = a.records[0]?.date || '';
      const latestDateB = b.records[0]?.date || '';
      return latestDateB.localeCompare(latestDateA);
    });
  }, [dailyRecords, products, searchTerm]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleStartEdit = (record: DailySaleRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (record: DailySaleRecord) => {
    if (editingRecord && onUpdateDailyRecord) {
      onUpdateDailyRecord(record);
    } else {
      onAddDailyRecord(record);
      setRecentlyAddedId(record.id);
      setTimeout(() => setRecentlyAddedId(null), 4000);
    }

    // Auto-adjust view filter to ensure the user immediately sees the saved record
    if (record.date) {
      if (datePreset === 'today' && record.date !== dates.todayFormatted) {
        setSelectedSpecificDate(record.date);
        setDatePreset('specific_date');
      } else if (datePreset === 'yesterday' && record.date !== dates.yesterdayFormatted) {
        setSelectedSpecificDate(record.date);
        setDatePreset('specific_date');
      } else if (datePreset === 'specific_date' && selectedSpecificDate !== record.date) {
        setSelectedSpecificDate(record.date);
      }
    }
  };

  const handleDeleteWholeCreative = (creative: GroupedCreative) => {
    if (creative.records.length > 0) {
      creative.records.forEach((r) => {
        onDeleteDailyRecord(r.id);
      });
    }
  };

  const handleDuplicateForToday = (record: DailySaleRecord) => {
    const duplicated: DailySaleRecord = {
      ...record,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: todayStr,
      salesCount: 0,
      cpa: 0,
    };
    onAddDailyRecord(duplicated);
    setRecentlyAddedId(duplicated.id);
    setTimeout(() => setRecentlyAddedId(null), 4000);
  };

  const handleUpdateRecord = (updated: DailySaleRecord) => {
    if (onUpdateDailyRecord) {
      onUpdateDailyRecord(updated);
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredRecords.map((r) => r.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Estás seguro de eliminar ${selectedIds.length} anuncios seleccionados?`)) {
      onDeleteBulkDailyRecords(selectedIds);
      setSelectedIds([]);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID de Anuncio',
      'Producto',
      'Fecha',
      'Mes',
      'Plataforma',
      'Gasto Publicitario (S/)',
      'Ventas WhatsApp',
      'CPA (S/)',
      'Facturación Estimada (S/)',
      'Departamentos',
      'Tiene Imagen',
    ];

    const rows = filteredRecords.map((r) => {
      const p = products.find(
        (prod) => prod.name.trim().toLowerCase() === r.defaultProduct.trim().toLowerCase()
      );
      const price = p?.salePrice || 79.0;
      const estRev = r.salesCount * price;
      return [
        `"${r.adId || ''}"`,
        `"${r.defaultProduct}"`,
        `"${r.date}"`,
        `"${r.month}"`,
        `"${r.platform || 'Meta Ads'}"`,
        r.dailySpend.toFixed(2),
        r.salesCount,
        r.cpa.toFixed(2),
        estRev.toFixed(2),
        `"${r.department || ''}"`,
        r.imageUrl ? 'SI' : 'NO',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Meta_Ads_Report_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Meta Ads Manager Official Header & KPI Scorecard */}
      <MetaAdsHeader
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        datePreset={datePreset}
        onDatePresetChange={handleDatePresetChange}
        selectedDate={selectedSpecificDate}
        onSelectedDateChange={handleSpecificDateChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        todayStr={todayStr}
        totalSpend={totalSpend}
        totalSales={totalSales}
        averageCPA={averageCPA}
        totalRevenue={totalRevenue}
        overallROAS={overallROAS}
        adsCount={filteredRecords.length}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onManualSync={onManualSync}
        onOpenCreateModal={handleOpenCreateModal}
        onExportCSV={handleExportCSV}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* 2. Main Content based on Level Tab */}

      {/* View A: Visual Creative Hub (Grid with Live +1 Venta Controller & Per-Card Date Filter) */}
      {currentTab === 'creative_hub' && (
        <div>
          {groupedCreatives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groupedCreatives.map((creative) => (
                <MetaGroupedCreativeCard
                  key={creative.key}
                  creative={creative}
                  products={products}
                  pricingRecords={pricingRecords}
                  todayStr={todayStr}
                  globalDatePreset={datePreset}
                  globalSelectedDate={selectedSpecificDate}
                  globalCustomStartDate={customStartDate}
                  globalCustomEndDate={customEndDate}
                  onAddDailyRecord={onAddDailyRecord}
                  onUpdateDailyRecord={handleUpdateRecord}
                  onDeleteDailyRecord={onDeleteDailyRecord}
                  onDeleteCreative={handleDeleteWholeCreative}
                  onStartEdit={handleStartEdit}
                  onViewImage={(img, rec) => setLightboxData({ imageUrl: img, record: rec || null })}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                No hay creativos publicitarios registrados
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Registra tu primer anuncio publicitario o agrega productos al inventario para gestionarlos aquí con su propio filtro por imagen.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 mx-auto shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Crear Primer Anuncio</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* View B: High-Precision Meta Ads Manager Table */}
      {currentTab === 'ads_table' && (
        <MetaAdsTable
          records={filteredRecords}
          allDailyRecords={dailyRecords}
          products={products}
          pricingRecords={pricingRecords}
          todayStr={todayStr}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkDelete={handleBulkDelete}
          onAddRecord={onAddDailyRecord}
          onUpdateRecord={handleUpdateRecord}
          onStartEdit={handleStartEdit}
          onDeleteRecord={onDeleteDailyRecord}
          onViewImage={(img, rec) => setLightboxData({ imageUrl: img, record: rec })}
          onDuplicateForToday={handleDuplicateForToday}
        />
      )}

      {/* View C: Meta Performance Analytics & Charts */}
      {currentTab === 'charts' && (
        <MetaAdsCharts records={filteredRecords} products={products} pricingRecords={pricingRecords} />
      )}

      {/* 3. Modals */}
      {/* Create & Edit Modal */}
      <MetaAdModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        editingRecord={editingRecord}
        products={products}
        pricingRecords={pricingRecords}
        todayStr={todayStr}
        dailyRecords={dailyRecords}
      />

      {/* Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxData.imageUrl}
        imageUrl={lightboxData.imageUrl}
        record={lightboxData.record}
        onClose={() => setLightboxData({ imageUrl: null, record: null })}
      />
    </div>
  );
};
