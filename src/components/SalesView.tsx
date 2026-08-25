import React, { useState, useMemo } from 'react';
import { DailySaleRecord, Product } from '../types';
import { MetaAdsHeader, MetaAdsTabLevel, MetaDatePreset } from './sales/MetaAdsHeader';
import { MetaGroupedCreativeCard, GroupedCreative } from './sales/MetaGroupedCreativeCard';
import { MetaAdsTable } from './sales/MetaAdsTable';
import { MetaAdsCharts } from './sales/MetaAdsCharts';
import { MetaAdModal } from './sales/MetaAdModal';
import { ImageLightboxModal } from './sales/ImageLightboxModal';
import { getDefaultAdIdForProduct } from '../lib/adUtils';
import { Plus, LayoutGrid, List, Sparkles } from 'lucide-react';

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
  // Navigation level tab (Creative Hub / Table / Charts) - Default: ads_table (Administrador de Anuncios)
  const [currentTab, setCurrentTab] = useState<MetaAdsTabLevel>('ads_table');

  // Date Range Filter State
  const todayStr = new Date().toISOString().split('T')[0];
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

  // Calculate Date Boundaries
  const getDateRange = () => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];

    const last7 = new Date(today);
    last7.setDate(last7.getDate() - 7);
    const last7Formatted = last7.toISOString().split('T')[0];

    const last14 = new Date(today);
    last14.setDate(last14.getDate() - 14);
    const last14Formatted = last14.toISOString().split('T')[0];

    const last30 = new Date(today);
    last30.setDate(last30.getDate() - 30);
    const last30Formatted = last30.toISOString().split('T')[0];

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
  const filteredRecords = dailyRecords.filter((rec) => {
    // 1. Date Filter
    let matchesDate = true;
    if (datePreset === 'today') {
      matchesDate = rec.date === dates.todayFormatted;
    } else if (datePreset === 'yesterday') {
      matchesDate = rec.date === dates.yesterdayFormatted;
    } else if (datePreset === 'specific_date') {
      matchesDate = rec.date === selectedSpecificDate;
    } else if (datePreset === 'last_7_days') {
      matchesDate = rec.date >= dates.last7Formatted && rec.date <= dates.todayFormatted;
    } else if (datePreset === 'last_14_days') {
      matchesDate = rec.date >= dates.last14Formatted && rec.date <= dates.todayFormatted;
    } else if (datePreset === 'last_30_days') {
      matchesDate = rec.date >= dates.last30Formatted && rec.date <= dates.todayFormatted;
    } else if (datePreset === 'this_month') {
      matchesDate = rec.date.startsWith(dates.thisMonthPrefix);
    } else if (datePreset === 'custom') {
      matchesDate = rec.date >= customStartDate && rec.date <= customEndDate;
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
        rec.date.includes(q) ||
        (rec.notes && rec.notes.toLowerCase().includes(q));
    }

    return matchesDate && matchesSearch;
  });

  // Calculate Overall Meta KPI Totals
  const totalSpend = filteredRecords.reduce((sum, r) => sum + (r.dailySpend || 0), 0);
  const totalSales = filteredRecords.reduce((sum, r) => sum + (r.salesCount || 0), 0);
  const averageCPA = totalSales > 0 ? totalSpend / totalSales : 0;

  const totalRevenue = filteredRecords.reduce((sum, r) => {
    const matchedP = products.find(
      (p) => p.name.trim().toLowerCase() === r.defaultProduct.trim().toLowerCase()
    );
    const price = matchedP?.salePrice || 79.0;
    return sum + (r.salesCount || 0) * price;
  }, 0);

  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Group dailyRecords and products into unique creative cards
  // STRICT RULE: PRIMARY KEY IS AD ID / UNIQUE CREATIVE.
  // Multi-pass merging ensures NO DUPLICATES by Ad ID, Product Name, or Image URL.
  const groupedCreatives = useMemo(() => {
    const groups: GroupedCreative[] = [];

    // Helper to find if an item matches an existing group
    const findMatchingGroup = (adId?: string, prodName?: string, imageUrl?: string) => {
      const cleanId = (adId || '').trim().replace(/^#/, '').toLowerCase();
      const cleanProd = (prodName || '').trim().toLowerCase();
      const cleanImg = (imageUrl || '').trim();

      return groups.find((g) => {
        const gId = (g.adId || '').trim().replace(/^#/, '').toLowerCase();
        const gProd = (g.primaryProduct || '').trim().toLowerCase();
        const gImg = (g.imageUrl || '').trim();

        // 1. Match by Ad ID if both exist
        if (cleanId && gId && cleanId === gId) return true;

        // 2. Match by Image if both exist
        if (cleanImg && gImg && cleanImg === gImg) return true;

        // 3. Match by Product Name if both exist
        if (cleanProd && gProd && cleanProd === gProd) return true;

        return false;
      });
    };

    // 1. Process all daily sale records
    dailyRecords.forEach((record) => {
      const prodName = record.defaultProduct?.trim() || 'Producto General';
      const cleanAdId = (record.adId?.trim() || getDefaultAdIdForProduct(prodName, dailyRecords))
        .replace(/^#/, '')
        .trim();
      const imageUrl = record.imageUrl?.trim() || undefined;

      const existing = findMatchingGroup(cleanAdId, prodName, imageUrl);

      if (existing) {
        if (!existing.records.some((r) => r.id === record.id)) {
          existing.records.push(record);
        }
        if (!existing.imageUrl && imageUrl) {
          existing.imageUrl = imageUrl;
        }
        if ((!existing.adId || existing.adId.startsWith('rec_')) && cleanAdId) {
          existing.adId = cleanAdId;
        }
        if (!existing.primaryProduct && prodName) {
          existing.primaryProduct = prodName;
        }
      } else {
        groups.push({
          key: `creative_${cleanAdId.toLowerCase()}_${groups.length}`,
          primaryProduct: prodName,
          adId: cleanAdId,
          imageUrl: imageUrl,
          records: [record],
        });
      }
    });

    // 2. Include catalog products that don't have records yet
    products.forEach((p) => {
      const prodName = p.name.trim();
      const catalogAdId = (p.sku?.trim() || getDefaultAdIdForProduct(prodName, dailyRecords))
        .replace(/^#/, '')
        .trim();
      const imageUrl = p.imageUrl?.trim() || undefined;

      const existing = findMatchingGroup(catalogAdId, prodName, imageUrl);
      if (existing) {
        if (!existing.imageUrl && imageUrl) {
          existing.imageUrl = imageUrl;
        }
        if (!existing.adId && catalogAdId) {
          existing.adId = catalogAdId;
        }
      } else {
        groups.push({
          key: `cat_${catalogAdId.toLowerCase()}_${groups.length}`,
          primaryProduct: prodName,
          adId: catalogAdId,
          imageUrl: imageUrl,
          records: [],
        });
      }
    });

    // 3. Multi-pass iterative merge: Guarantees 0 duplicate Ad IDs, 0 duplicate Products, 0 duplicate Images
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const g1 = groups[i];
          const g2 = groups[j];

          const id1 = (g1.adId || '').trim().replace(/^#/, '').toLowerCase();
          const id2 = (g2.adId || '').trim().replace(/^#/, '').toLowerCase();
          const prod1 = (g1.primaryProduct || '').trim().toLowerCase();
          const prod2 = (g2.primaryProduct || '').trim().toLowerCase();
          const img1 = (g1.imageUrl || '').trim();
          const img2 = (g2.imageUrl || '').trim();

          const matchId = id1 && id2 && id1 === id2;
          const matchProd = prod1 && prod2 && prod1 === prod2;
          const matchImg = img1 && img2 && img1 === img2;

          if (matchId || matchProd || matchImg) {
            // Merge g2 into g1 and delete g2
            g2.records.forEach((r) => {
              if (!g1.records.some((er) => er.id === r.id)) {
                g1.records.push(r);
              }
            });
            if (!g1.imageUrl && g2.imageUrl) g1.imageUrl = g2.imageUrl;
            if (!g1.adId && g2.adId) g1.adId = g2.adId;
            groups.splice(j, 1);
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }

    let list = groups;

    // Apply search filter if present
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.primaryProduct.toLowerCase().includes(q) ||
          c.adId.toLowerCase().includes(q) ||
          c.records.some((r) => r.department?.toLowerCase().includes(q))
      );
    }

    // Sort by most recent activity / highest sales
    return list.sort((a, b) => {
      const salesA = a.records.reduce((s, r) => s + (r.salesCount || 0), 0);
      const salesB = b.records.reduce((s, r) => s + (r.salesCount || 0), 0);
      return salesB - salesA;
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
                  todayStr={todayStr}
                  globalDatePreset={datePreset}
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
        <MetaAdsCharts records={filteredRecords} products={products} />
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
