import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
  FileText,
  Package,
  ShoppingCart,
  Megaphone,
  TrendingUp,
  Save,
  Trash2,
  RotateCcw,
  Sparkles,
  Search,
  ChevronRight,
  Server,
  Calculator,
  Tag,
  Gift,
  User
} from 'lucide-react';
import {
  Product,
  Sale,
  DailySaleRecord,
  MetaAdExpense,
  WhatsAppTemplate,
  PricingCalculationRecord,
  AISettings,
  DatabaseStatus,
  DatabaseBackup
} from '../types';
import { api, FullDatabasePayload } from '../lib/api';

interface DatabaseViewProps {
  products: Product[];
  sales: Sale[];
  dailyRecords: DailySaleRecord[];
  metaExpenses: MetaAdExpense[];
  templates: WhatsAppTemplate[];
  pricingRecords?: PricingCalculationRecord[];
  aiSettings: AISettings;
  onRefreshAllData: (data: FullDatabasePayload) => void;
  showToast: (msg: string) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  products,
  sales,
  dailyRecords,
  metaExpenses,
  templates,
  pricingRecords = [],
  aiSettings,
  onRefreshAllData,
  showToast,
}) => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [activeTableTab, setActiveTableTab] = useState<'products' | 'dailyRecords' | 'sales' | 'metaExpenses' | 'pricingRecords' | 'templates'>('products');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<string | null>(null);

  // Fetch status and backups
  const loadStatusAndBackups = async () => {
    setIsLoading(true);
    try {
      const [statusData, backupsData] = await Promise.all([
        api.getDbStatus(),
        api.getBackups(),
      ]);
      if (statusData) setDbStatus(statusData);
      if (backupsData) setBackups(backupsData);
    } catch (err) {
      console.error('Error loading DB status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatusAndBackups();
  }, []);

  // Force bidirectional Sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const payload: FullDatabasePayload = {
        products,
        sales,
        dailyRecords,
        metaExpenses,
        templates,
        pricingRecords,
        aiSettings,
      };

      const success = await api.syncDatabase(payload);
      if (success) {
        showToast('¡Base de datos sincronizada con éxito en el servidor!');
        await loadStatusAndBackups();
      } else {
        showToast('Error al sincronizar con el servidor.');
      }
    } catch (err) {
      showToast('Fallo de conexión al sincronizar BD.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Create Snapshot Backup
  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      // First sync current state
      await api.syncDatabase({
        products,
        sales,
        dailyRecords,
        metaExpenses,
        templates,
        pricingRecords,
        aiSettings,
      });

      const bkp = await api.createBackup(backupLabel.trim() || undefined);
      if (bkp) {
        showToast(`Copia de seguridad "${bkp.label}" creada correctamente.`);
        setBackupLabel('');
        await loadStatusAndBackups();
      } else {
        showToast('No se pudo crear la copia de seguridad.');
      }
    } catch {
      showToast('Error al crear respaldo en el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore from Backup
  const handleRestoreBackup = async (backupId: string) => {
    if (!window.confirm('¿Confirmas que deseas restaurar este punto de respaldo? Se sobreescribirán los datos actuales.')) {
      return;
    }
    setIsLoading(true);
    try {
      const success = await api.restoreBackup(backupId);
      if (success) {
        const fullData = await api.fetchFullDatabase();
        if (fullData) {
          onRefreshAllData(fullData);
          showToast('Base de datos restaurada correctamente desde el respaldo.');
          await loadStatusAndBackups();
        }
      } else {
        showToast('Error al restaurar respaldo.');
      }
    } catch {
      showToast('Error al ejecutar restauración.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset database to default seed
  const handleResetDatabase = async () => {
    if (!window.confirm('¿Deseas reiniciar la base de datos a los valores iniciales de fábrica? Te sugerimos crear una copia de seguridad antes.')) {
      return;
    }
    setIsLoading(true);
    try {
      const success = await api.resetDatabase();
      if (success) {
        const fullData = await api.fetchFullDatabase();
        if (fullData) {
          onRefreshAllData(fullData);
          showToast('Base de datos reiniciada con datos base de prueba.');
          await loadStatusAndBackups();
        }
      }
    } catch {
      showToast('Error al reiniciar base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Export JSON Dump
  const handleExportJson = () => {
    const fullDbData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      products,
      sales,
      dailyRecords,
      metaExpenses,
      templates,
      pricingRecords,
      aiSettings,
    };
    const blob = new Blob([JSON.stringify(fullDbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drayo_db_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Archivo JSON de la base de datos descargado.');
  };

  // Import JSON Dump
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || typeof json !== 'object') {
          showToast('El archivo no contiene un JSON válido.');
          return;
        }

        setIsLoading(true);
        const success = await api.importDatabase(json);
        if (success) {
          const fullData = await api.fetchFullDatabase();
          if (fullData) {
            onRefreshAllData(fullData);
            showToast('¡Base de datos importada y restaurada con éxito!');
            await loadStatusAndBackups();
          }
        } else {
          showToast('Error al importar la base de datos.');
        }
      } catch (err) {
        showToast('Error al parsear el archivo JSON.');
      } finally {
        setIsLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const totalAllRecords =
    products.length + sales.length + dailyRecords.length + metaExpenses.length + templates.length + pricingRecords.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Base de Datos D'RAYO
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Servidor Persistente Activo
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  v2.0 Node Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Almacenamiento persistente en disco en el servidor con sincronización en tiempo real, respaldos automáticos y soporte para exportación/importación completa.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleForceSync}
              disabled={isSyncing || isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
              title="Descargar copia de seguridad en archivo JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar JSON</span>
            </button>

            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Importar BD</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Database Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Total Registros</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              {totalAllRecords}
            </p>
            <span className="text-[10px] text-slate-500">en 5 tablas activas</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Ubicación DB</span>
              <HardDrive className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xs font-bold text-slate-800 truncate font-mono">
              /data/database.json
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Disco Persistente
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Tamaño en Disco</span>
              <Server className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              {dbStatus ? `${dbStatus.fileSizeKb} KB` : '~12 KB'}
            </p>
            <span className="text-[10px] text-slate-500">JSON optimizado</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Puntos de Respaldo</span>
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              {backups.length}
            </p>
            <span className="text-[10px] text-slate-500">Snapshots guardados</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Explorer & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Table Explorer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Table Navigation Tabs */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setActiveTableTab('products')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTableTab === 'products'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Productos ({products.length})</span>
                </button>

                <button
                  onClick={() => setActiveTableTab('dailyRecords')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTableTab === 'dailyRecords'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Registros CPA ({dailyRecords.length})</span>
                </button>

                <button
                  onClick={() => setActiveTableTab('sales')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTableTab === 'sales'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Ventas ({sales.length})</span>
                </button>

                <button
                  onClick={() => setActiveTableTab('metaExpenses')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTableTab === 'metaExpenses'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Meta Ads ({metaExpenses.length})</span>
                </button>

                <button
                  onClick={() => setActiveTableTab('pricingRecords')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTableTab === 'pricingRecords'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Cálculos Precios ({pricingRecords.length})</span>
                </button>

                <button
                  onClick={() => setActiveTableTab('templates')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTableTab === 'templates'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Plantillas ({templates.length})</span>
                </button>
              </div>

              {/* Table Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en tabla..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
                />
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto max-h-[420px] no-scrollbar">
              {activeTableTab === 'products' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5">ID / SKU</th>
                      <th className="px-4 py-2.5">Producto</th>
                      <th className="px-4 py-2.5">Categoría</th>
                      <th className="px-4 py-2.5">Costo Unit.</th>
                      <th className="px-4 py-2.5">Precio Venta</th>
                      <th className="px-4 py-2.5">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products
                      .filter((p) =>
                        p.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        p.category.toLowerCase().includes(tableSearch.toLowerCase())
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-500">{p.sku || p.id}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{p.name}</td>
                          <td className="px-4 py-2.5 text-slate-600">{p.category}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-700">S/ {p.costPrice.toFixed(2)}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">S/ {p.salePrice.toFixed(2)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold font-mono text-[11px] ${
                              p.stock <= p.minStock
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.stock} und.
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {activeTableTab === 'dailyRecords' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">Plataforma</th>
                      <th className="px-4 py-2.5">ID Anuncio</th>
                      <th className="px-4 py-2.5">Producto</th>
                      <th className="px-4 py-2.5">Gasto Publicitario</th>
                      <th className="px-4 py-2.5">Ventas</th>
                      <th className="px-4 py-2.5">CPA Unitario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyRecords
                      .filter((r) =>
                        r.defaultProduct.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        r.platform.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        (r.adId || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
                        r.date.includes(tableSearch)
                      )
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-700">{r.date}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">{r.platform}</td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-cyan-700 font-bold">
                            {r.adId || <span className="text-slate-300 font-normal">-</span>}
                          </td>
                          <td className="px-4 py-2.5 text-slate-800">{r.defaultProduct}</td>
                          <td className="px-4 py-2.5 font-mono text-blue-600 font-bold">S/ {r.dailySpend.toFixed(2)}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{r.salesCount}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-amber-600">S/ {r.cpa.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {activeTableTab === 'sales' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5">ID Venta</th>
                      <th className="px-4 py-2.5">ID Anuncio</th>
                      <th className="px-4 py-2.5">Cliente</th>
                      <th className="px-4 py-2.5">Teléfono</th>
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">Total</th>
                      <th className="px-4 py-2.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No hay pedidos individuales registrados aún.
                        </td>
                      </tr>
                    ) : (
                      sales
                        .filter((s) =>
                          s.customerName.toLowerCase().includes(tableSearch.toLowerCase()) ||
                          s.customerPhone.includes(tableSearch) ||
                          (s.adId || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
                          s.id.includes(tableSearch)
                        )
                        .map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-700">#{s.id}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px] text-cyan-700 font-bold">
                              {s.adId || <span className="text-slate-300 font-normal">-</span>}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-900">{s.customerName}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-600">{s.customerPhone}</td>
                            <td className="px-4 py-2.5 text-slate-600">{s.date}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">S/ {s.total.toFixed(2)}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTableTab === 'metaExpenses' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5">ID Transacción</th>
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">Monto (PEN)</th>
                      <th className="px-4 py-2.5">Periodo</th>
                      <th className="px-4 py-2.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metaExpenses
                      .filter((e) =>
                        e.transactionId.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        e.date.includes(tableSearch) ||
                        e.period.includes(tableSearch)
                      )
                      .map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2.5 font-mono font-semibold text-slate-700">{e.transactionId}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{e.date}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-blue-600">S/ {e.amount.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-slate-600">{e.period}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {activeTableTab === 'pricingRecords' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5">Título / Cálculo</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">Precio Venta</th>
                      <th className="px-4 py-2.5">Costo Total</th>
                      <th className="px-4 py-2.5">Ganancia Neta</th>
                      <th className="px-4 py-2.5">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pricingRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No hay registros de cálculos de precios guardados aún.
                        </td>
                      </tr>
                    ) : (
                      pricingRecords
                        .filter((r) =>
                          r.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
                          (r.productName && r.productName.toLowerCase().includes(tableSearch.toLowerCase())) ||
                          (r.notes && r.notes.toLowerCase().includes(tableSearch.toLowerCase())) ||
                          r.type.toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-900">
                              <div>{r.title}</div>
                              {r.productName && <div className="text-[10px] text-slate-500 font-normal">{r.productName}</div>}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                r.type === 'combo'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : r.type === 'personal_budget'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {r.type === 'combo' ? 'Combo / Pack' : r.type === 'personal_budget' ? 'Presupuesto' : 'Por Unidad'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-600">{r.createdAt ? r.createdAt.slice(0, 10) : '-'}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">
                              {r.type === 'personal_budget' ? '-' : `S/ ${(r.salePrice || 0).toFixed(2)}`}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-700">
                              {r.type === 'personal_budget' ? `S/ ${(r.totalPersonalBudget || 0).toFixed(2)}` : `S/ ${(r.totalCost || 0).toFixed(2)}`}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-blue-600">
                              {r.type === 'personal_budget' ? '-' : `S/ ${(r.netProfit || 0).toFixed(2)}`}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                              {r.type === 'personal_budget' ? '-' : `${(r.netMarginPercent || 0).toFixed(1)}%`}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTableTab === 'templates' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5">Título</th>
                      <th className="px-4 py-2.5">Categoría</th>
                      <th className="px-4 py-2.5">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {templates
                      .filter((t) =>
                        t.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        t.text.toLowerCase().includes(tableSearch.toLowerCase()) ||
                        t.category.toLowerCase().includes(tableSearch.toLowerCase())
                      )
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-900">{t.title}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 truncate max-w-xs">{t.text}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Snapshot Backups & Maintenance */}
        <div className="space-y-6">
          {/* Create Backup Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Crear Punto de Respaldo</h3>
            </div>
            <p className="text-xs text-slate-500">
              Genera una instantánea segura de todas las tablas en la base de datos persistente.
            </p>

            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Nombre o motivo del respaldo (opcional)..."
                value={backupLabel}
                onChange={(e) => setBackupLabel(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCreateBackup}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Copia de Seguridad</span>
              </button>
            </div>
          </div>

          {/* Backup History */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Historial de Respaldos</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {backups.length} disponibles
              </span>
            </div>

            {backups.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No hay copias de seguridad guardadas.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {backups.map((bkp) => (
                  <div
                    key={bkp.id}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{bkp.label}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{new Date(bkp.timestamp).toLocaleString('es-PE')}</span>
                        <span>•</span>
                        <span>{bkp.recordCount} registros</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreBackup(bkp.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                      title="Restaurar a este punto"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone: Reset DB */}
          <div className="bg-rose-50/50 rounded-2xl border border-rose-200/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Zona de Restablecimiento</span>
            </div>
            <p className="text-[11px] text-rose-600/90 leading-relaxed">
              Restablece todas las tablas a los datos de fábrica. Se recomienda exportar un respaldo antes.
            </p>
            <button
              onClick={handleResetDatabase}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sembrar Datos Iniciales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
