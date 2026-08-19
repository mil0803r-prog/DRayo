import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, MetaAdExpense, WhatsAppTemplate, TabType, AISettings, DailySaleRecord, PricingCalculationRecord } from './types';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredSales,
  saveStoredSales,
  getStoredDailyRecords,
  saveStoredDailyRecords,
  getStoredMetaExpenses,
  saveStoredMetaExpenses,
  getStoredTemplates,
  saveStoredTemplates,
  getStoredPricingRecords,
  saveStoredPricingRecords,
  getStoredAISettings,
  saveStoredAISettings,
  resetAllToDefaults,
  DEFAULT_AI_SETTINGS,
} from './lib/storage';
import { INITIAL_PRODUCTS, INITIAL_TEMPLATES, INITIAL_PRICING_RECORDS } from './data/sampleData';
import { api, FullDatabasePayload } from './lib/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import {
  saveUserCloudState,
  subscribeToUserCloudState,
  loadUserCloudState,
  UserCloudState
} from './lib/firebase';

import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { MetaAdsView } from './components/MetaAdsView';
import { InventoryView } from './components/InventoryView';
import { PricingCalculatorView } from './components/PricingCalculatorView';
import { MetaExportView } from './components/MetaExportView';
import { WhatsAppTemplatesView } from './components/WhatsAppTemplatesView';
import { DatabaseView } from './components/DatabaseView';

import { NewSaleModal } from './components/NewSaleModal';
import { NewExpenseModal } from './components/NewExpenseModal';
import { NewProductModal } from './components/NewProductModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AISettingsModal } from './components/AISettingsModal';
import { Sparkles, Loader2 } from 'lucide-react';

function DashboardApp() {
  const { currentUser, isGuestMode } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Sidebar Layout State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Core Data State (initialized from storage fallback)
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [sales, setSales] = useState<Sale[]>(getStoredSales);
  const [dailyRecords, setDailyRecords] = useState<DailySaleRecord[]>(getStoredDailyRecords);
  const [metaExpenses, setMetaExpenses] = useState<MetaAdExpense[]>(getStoredMetaExpenses);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(getStoredTemplates);
  const [pricingRecords, setPricingRecords] = useState<PricingCalculationRecord[]>(getStoredPricingRecords);
  const [aiSettings, setAiSettings] = useState<AISettings>(getStoredAISettings);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);

  // Cloud Synchronization State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Modals state
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Ref to track if change came from cloud listener to avoid echo loops
  const isApplyingRemoteSync = useRef(false);

  // 1. Firebase Firestore Real-Time Listener for the Logged-In User
  useEffect(() => {
    if (!currentUser) {
      setIsCloudLoaded(true);
      return;
    }

    setIsSyncing(true);

    // Initial check and subscription
    const unsubscribe = subscribeToUserCloudState(
      currentUser.uid,
      (cloudState: UserCloudState) => {
        isApplyingRemoteSync.current = true;
        if (cloudState.products && Array.isArray(cloudState.products)) {
          setProducts(cloudState.products);
          saveStoredProducts(cloudState.products);
        }
        if (cloudState.sales && Array.isArray(cloudState.sales)) {
          setSales(cloudState.sales);
          saveStoredSales(cloudState.sales);
        }
        if (cloudState.dailyRecords && Array.isArray(cloudState.dailyRecords)) {
          setDailyRecords(cloudState.dailyRecords);
          saveStoredDailyRecords(cloudState.dailyRecords);
        }
        if (cloudState.metaExpenses && Array.isArray(cloudState.metaExpenses)) {
          setMetaExpenses(cloudState.metaExpenses);
          saveStoredMetaExpenses(cloudState.metaExpenses);
        }
        if (cloudState.templates && Array.isArray(cloudState.templates)) {
          setTemplates(cloudState.templates);
          saveStoredTemplates(cloudState.templates);
        }
        if (cloudState.pricingRecords && Array.isArray(cloudState.pricingRecords)) {
          setPricingRecords(cloudState.pricingRecords);
          saveStoredPricingRecords(cloudState.pricingRecords);
        }
        if (cloudState.aiSettings) {
          setAiSettings(cloudState.aiSettings);
          saveStoredAISettings(cloudState.aiSettings);
        }
        setLastSyncTime(new Date());
        setIsSyncing(false);
        setIsCloudLoaded(true);
        setTimeout(() => {
          isApplyingRemoteSync.current = false;
        }, 300);
      },
      (err) => {
        console.warn('Firestore subscription notice:', err);
        setIsSyncing(false);
        setIsCloudLoaded(true);
      }
    );

    // If newly created user with no data in cloud, initialize with default templates & products
    loadUserCloudState(currentUser.uid).then((existingState) => {
      if (!existingState) {
        const initialPayload: Partial<UserCloudState> = {
          products: INITIAL_PRODUCTS,
          sales: [],
          dailyRecords: [],
          metaExpenses: [],
          templates: INITIAL_TEMPLATES,
          pricingRecords: INITIAL_PRICING_RECORDS,
          aiSettings: DEFAULT_AI_SETTINGS,
        };
        saveUserCloudState(currentUser.uid, initialPayload).catch(console.warn);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Helper to persist user state to Firestore and Server DB
  const persistStateToCloud = (customState?: Partial<FullDatabasePayload>) => {
    if (isApplyingRemoteSync.current) return;

    const payload = {
      products: customState?.products || products,
      sales: customState?.sales || sales,
      dailyRecords: customState?.dailyRecords || dailyRecords,
      metaExpenses: customState?.metaExpenses || metaExpenses,
      templates: customState?.templates || templates,
      pricingRecords: customState?.pricingRecords || pricingRecords,
      aiSettings: customState?.aiSettings || aiSettings,
    };

    if (currentUser) {
      saveUserCloudState(currentUser.uid, payload)
        .then(() => setLastSyncTime(new Date()))
        .catch((err) => console.warn('Cloud save error:', err));
    }

    // Also sync to server database as a secondary fallback
    api.syncDatabase(payload).catch((err) => console.warn('Server fallback sync error:', err));
  };

  const handleManualSync = async () => {
    if (!currentUser) {
      showToast('Modo local: los datos se guardan en este dispositivo.');
      return;
    }
    setIsSyncing(true);
    try {
      const state = await loadUserCloudState(currentUser.uid);
      if (state) {
        if (state.products) setProducts(state.products);
        if (state.sales) setSales(state.sales);
        if (state.dailyRecords) setDailyRecords(state.dailyRecords);
        if (state.metaExpenses) setMetaExpenses(state.metaExpenses);
        if (state.templates) setTemplates(state.templates);
        if (state.pricingRecords) setPricingRecords(state.pricingRecords);
        if (state.aiSettings) setAiSettings(state.aiSettings);
        setLastSyncTime(new Date());
        showToast('¡Base de datos Firestore sincronizada en tiempo real!');
      }
    } catch (err) {
      console.warn('Manual sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshAllData = (newData: FullDatabasePayload) => {
    if (newData.products) {
      setProducts(newData.products);
      saveStoredProducts(newData.products);
    }
    if (newData.sales) {
      setSales(newData.sales);
      saveStoredSales(newData.sales);
    }
    if (newData.dailyRecords) {
      setDailyRecords(newData.dailyRecords);
      saveStoredDailyRecords(newData.dailyRecords);
    }
    if (newData.metaExpenses) {
      setMetaExpenses(newData.metaExpenses);
      saveStoredMetaExpenses(newData.metaExpenses);
    }
    if (newData.templates) {
      setTemplates(newData.templates);
      saveStoredTemplates(newData.templates);
    }
    if (newData.pricingRecords) {
      setPricingRecords(newData.pricingRecords);
      saveStoredPricingRecords(newData.pricingRecords);
    }
    if (newData.aiSettings) {
      setAiSettings(newData.aiSettings);
      saveStoredAISettings(newData.aiSettings);
    }
    persistStateToCloud(newData);
  };

  const handleSaveAISettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    saveStoredAISettings(newSettings);
    persistStateToCloud({ aiSettings: newSettings });
    showToast(`Ajustes de IA guardados. Modelo activo: ${newSettings.model}`);
  };

  // Handlers for WhatsApp Daily Sale Records (Connected to Inventory & Cloud DB)
  const handleAddDailyRecord = (newRecord: DailySaleRecord) => {
    const updatedRecords = [newRecord, ...dailyRecords];
    setDailyRecords(updatedRecords);
    saveStoredDailyRecords(updatedRecords);

    // Automatically deduct stock in Inventory for the corresponding product if specified
    const updatedProducts = products.map((p) => {
      if (p.name.trim().toLowerCase() === newRecord.defaultProduct.trim().toLowerCase()) {
        return { ...p, stock: Math.max(0, p.stock - newRecord.salesCount) };
      }
      return p;
    });

    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
    showToast(`¡Venta WhatsApp registrada! Datos guardados en la nube para todos tus dispositivos.`);
  };

  const handleUpdateDailyRecord = (updatedRecord: DailySaleRecord) => {
    const oldRecord = dailyRecords.find((r) => r.id === updatedRecord.id);

    let updatedProducts = [...products];
    if (oldRecord) {
      updatedProducts = products.map((p) => {
        let currentStock = p.stock;
        if (p.name.trim().toLowerCase() === oldRecord.defaultProduct.trim().toLowerCase()) {
          currentStock += oldRecord.salesCount;
        }
        if (p.name.trim().toLowerCase() === updatedRecord.defaultProduct.trim().toLowerCase()) {
          currentStock -= updatedRecord.salesCount;
        }
        return { ...p, stock: Math.max(0, currentStock) };
      });
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
    }

    const updatedRecords = dailyRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    setDailyRecords(updatedRecords);
    saveStoredDailyRecords(updatedRecords);

    persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
    showToast(`¡Registro de venta actualizado en la nube!`);
  };

  const handleDeleteDailyRecord = (recordId: string) => {
    const rec = dailyRecords.find((r) => r.id === recordId);
    let updatedProducts = [...products];
    if (rec) {
      updatedProducts = products.map((p) => {
        if (p.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase()) {
          return { ...p, stock: p.stock + rec.salesCount };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
    }

    const updatedRecords = dailyRecords.filter((r) => r.id !== recordId);
    setDailyRecords(updatedRecords);
    saveStoredDailyRecords(updatedRecords);

    persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
    showToast('Registro de venta eliminado y sincronizado.');
  };

  const handleDeleteBulkDailyRecords = (recordIds: string[]) => {
    const idsSet = new Set(recordIds);
    const recordsToDelete = dailyRecords.filter((r) => idsSet.has(r.id));

    let updatedProducts = [...products];
    recordsToDelete.forEach((rec) => {
      updatedProducts = updatedProducts.map((p) => {
        if (p.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase()) {
          return { ...p, stock: p.stock + rec.salesCount };
        }
        return p;
      });
    });

    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    const updatedRecords = dailyRecords.filter((r) => !idsSet.has(r.id));
    setDailyRecords(updatedRecords);
    saveStoredDailyRecords(updatedRecords);

    persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
    showToast(`${recordIds.length} registros eliminados de la base de datos.`);
  };

  // Handlers for Standard Sales
  const handleAddSale = (newSale: Sale) => {
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveStoredSales(updatedSales);

    const updatedProducts = products.map((p) => {
      const itemInSale = newSale.items.find((it) => it.productId === p.id);
      if (itemInSale) {
        return { ...p, stock: Math.max(0, p.stock - itemInSale.quantity) };
      }
      return p;
    });

    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    persistStateToCloud({ sales: updatedSales, products: updatedProducts });
    showToast(`¡Venta #${newSale.id} registrada en la base de datos!`);
  };

  const handleUpdateSaleStatus = (saleId: string, status: Sale['status']) => {
    const updatedSales = sales.map((s) => (s.id === saleId ? { ...s, status } : s));
    setSales(updatedSales);
    saveStoredSales(updatedSales);
    persistStateToCloud({ sales: updatedSales });
    showToast(`Estado del pedido #${saleId} actualizado a "${status}"`);
  };

  const handleDeleteSale = (saleId: string) => {
    const updatedSales = sales.filter((s) => s.id !== saleId);
    setSales(updatedSales);
    saveStoredSales(updatedSales);
    persistStateToCloud({ sales: updatedSales });
    showToast(`Pedido #${saleId} eliminado`);
  };

  // Handlers for Products
  const handleAddProduct = (newProduct: Product) => {
    const updated = [...products, newProduct];
    setProducts(updated);
    saveStoredProducts(updated);
    persistStateToCloud({ products: updated });
    showToast(`Producto "${newProduct.name}" agregado al inventario en la nube`);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
    setProducts(updated);
    saveStoredProducts(updated);
    persistStateToCloud({ products: updated });
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveStoredProducts(updated);
    persistStateToCloud({ products: updated });
    showToast('Producto eliminado del inventario');
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    saveStoredProducts(updated);
    persistStateToCloud({ products: updated });
    showToast(`Producto "${updatedProduct.name}" actualizado`);
  };

  const handleUpdateProductPrice = (productId: string, newSalePrice: number, newCostPrice: number) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, salePrice: newSalePrice, costPrice: newCostPrice } : p));
    setProducts(updated);
    saveStoredProducts(updated);
    persistStateToCloud({ products: updated });
    showToast('Precio e insumos actualizados en inventario');
  };

  // Handlers for Meta Expenses
  const handleAddExpense = (newExpense: MetaAdExpense) => {
    const updated = [newExpense, ...metaExpenses];
    setMetaExpenses(updated);
    saveStoredMetaExpenses(updated);
    persistStateToCloud({ metaExpenses: updated });
    showToast('Nuevo gasto de publicidad Meta Ads registrado');
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = metaExpenses.filter((e) => e.id !== expenseId);
    setMetaExpenses(updated);
    saveStoredMetaExpenses(updated);
    persistStateToCloud({ metaExpenses: updated });
    showToast('Gasto publicitario eliminado');
  };

  // Handlers for Meta Export
  const handleMarkSalesAsExported = (saleIds: string[]) => {
    const updated = sales.map((s) => (saleIds.includes(s.id) ? { ...s, metaEventExported: true } : s));
    setSales(updated);
    saveStoredSales(updated);
    persistStateToCloud({ sales: updated });
    showToast(`¡${saleIds.length} eventos marcados como exportados a Meta Ads!`);
  };

  // Handlers for Templates
  const handleAddTemplate = (newTemplate: WhatsAppTemplate) => {
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveStoredTemplates(updated);
    persistStateToCloud({ templates: updated });
    showToast('Plantilla de respuesta rápida guardada');
  };

  // Handlers for Pricing Calculations Records
  const handleAddPricingRecord = (newRecord: PricingCalculationRecord) => {
    let updated: PricingCalculationRecord[];
    const idx = pricingRecords.findIndex((r) => r.id === newRecord.id);
    if (idx >= 0) {
      updated = [...pricingRecords];
      updated[idx] = newRecord;
    } else {
      updated = [newRecord, ...pricingRecords];
    }
    setPricingRecords(updated);
    saveStoredPricingRecords(updated);
    persistStateToCloud({ pricingRecords: updated });
    showToast(`¡Cálculo "${newRecord.title}" guardado en la base de datos!`);
  };

  const handleDeletePricingRecord = (recordId: string) => {
    const updated = pricingRecords.filter((r) => r.id !== recordId);
    setPricingRecords(updated);
    saveStoredPricingRecords(updated);
    persistStateToCloud({ pricingRecords: updated });
    showToast('Registro de cálculo eliminado');
  };

  const handleBulkDeletePricingRecords = (recordIds: string[]) => {
    const idsSet = new Set(recordIds);
    const updated = pricingRecords.filter((r) => !idsSet.has(r.id));
    setPricingRecords(updated);
    saveStoredPricingRecords(updated);
    persistStateToCloud({ pricingRecords: updated });
    showToast(`${recordIds.length} registros de cálculos eliminados.`);
  };

  const handleResetData = async () => {
    if (window.confirm('¿Deseas restablecer todos los datos a la configuración inicial por defecto?')) {
      resetAllToDefaults();
      const initialPayload = {
        products: INITIAL_PRODUCTS,
        sales: [],
        dailyRecords: [],
        metaExpenses: [],
        templates: INITIAL_TEMPLATES,
        pricingRecords: INITIAL_PRICING_RECORDS,
        aiSettings: DEFAULT_AI_SETTINGS,
      };
      setProducts(initialPayload.products);
      setSales(initialPayload.sales);
      setDailyRecords(initialPayload.dailyRecords);
      setMetaExpenses(initialPayload.metaExpenses);
      setTemplates(initialPayload.templates);
      setPricingRecords(initialPayload.pricingRecords);
      setAiSettings(initialPayload.aiSettings);
      persistStateToCloud(initialPayload);
      showToast('Datos restablecidos correctamente en la nube');
    }
  };

  // Consolidated High-level KPI metrics
  const totalStandardSalesRevenue = sales
    .filter((s) => s.status !== 'Cancelada')
    .reduce((acc, s) => acc + s.total, 0);

  const totalWhatsAppRevenue = dailyRecords.reduce((acc, rec) => {
    const p = products.find((prod) => prod.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase());
    const unitPrice = p ? p.salePrice : 0;
    return acc + rec.salesCount * unitPrice;
  }, 0);

  const totalSalesRevenue = totalStandardSalesRevenue + totalWhatsAppRevenue;

  const totalMetaAdSpend = metaExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalWhatsAppAdSpend = dailyRecords.reduce((acc, r) => acc + r.dailySpend, 0);
  const totalAdSpend = totalMetaAdSpend + totalWhatsAppAdSpend;

  const totalStandardCOGS = sales
    .filter((s) => s.status !== 'Cancelada')
    .reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    }, 0);

  const totalWhatsAppCOGS = dailyRecords.reduce((acc, rec) => {
    const p = products.find((prod) => prod.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase());
    const unitCost = p ? p.costPrice : 0;
    return acc + rec.salesCount * unitCost;
  }, 0);

  const totalCOGS = totalStandardCOGS + totalWhatsAppCOGS;
  const totalNetProfit = totalSalesRevenue - totalCOGS - totalAdSpend;
  const roas = totalAdSpend > 0 ? totalSalesRevenue / totalAdSpend : 0;
  const unexportedCount = sales.filter((s) => !s.metaEventExported && s.status !== 'Cancelada').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unexportedCount={unexportedCount}
        salesCount={sales.length}
        productsCount={products.length}
        totalNetProfit={totalNetProfit}
        roas={roas}
        onOpenNewSaleModal={() => setShowNewSaleModal(true)}
        onOpenNewExpenseModal={() => setShowNewExpenseModal(true)}
        onOpenAIAssistant={() => setShowAIAssistantModal(true)}
        onOpenAISettings={() => setShowAISettingsModal(true)}
        onResetData={handleResetData}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-100 relative">
        
        {/* Sticky Top Header with Breadcrumbs, Search/AI & User Profile */}
        <TopHeader
          activeTab={activeTab}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          onManualSync={handleManualSync}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenAIAssistant={() => setShowAIAssistantModal(true)}
          onOpenAISettings={() => setShowAISettingsModal(true)}
        />

        {/* View Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              sales={sales}
              dailyRecords={dailyRecords}
              metaExpenses={metaExpenses}
              products={products}
              setActiveTab={setActiveTab}
              onOpenAIAssistant={() => setShowAIAssistantModal(true)}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseView
              products={products}
              sales={sales}
              dailyRecords={dailyRecords}
              metaExpenses={metaExpenses}
              templates={templates}
              pricingRecords={pricingRecords}
              aiSettings={aiSettings}
              onRefreshAllData={handleRefreshAllData}
              showToast={showToast}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              products={products}
              dailyRecords={dailyRecords}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
              onManualSync={handleManualSync}
              onAddDailyRecord={handleAddDailyRecord}
              onUpdateDailyRecord={handleUpdateDailyRecord}
              onDeleteDailyRecord={handleDeleteDailyRecord}
              onDeleteBulkDailyRecords={handleDeleteBulkDailyRecords}
            />
          )}

          {activeTab === 'meta_ads' && (
            <MetaAdsView
              metaExpenses={metaExpenses}
              products={products}
              pricingRecords={pricingRecords}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenNewExpenseModal={() => setShowNewExpenseModal(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateStock={handleUpdateStock}
              onDeleteProduct={handleDeleteProduct}
              onEditProduct={handleUpdateProduct}
              onOpenNewProductModal={() => setShowNewProductModal(true)}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingCalculatorView
              products={products}
              pricingRecords={pricingRecords}
              onAddPricingRecord={handleAddPricingRecord}
              onDeletePricingRecord={handleDeletePricingRecord}
              onBulkDeletePricingRecords={handleBulkDeletePricingRecords}
              onUpdateProductPrice={handleUpdateProductPrice}
              showToast={showToast}
            />
          )}

          {activeTab === 'meta_export' && (
            <MetaExportView
              sales={sales}
              onMarkSalesAsExported={handleMarkSalesAsExported}
            />
          )}

          {activeTab === 'templates' && (
            <WhatsAppTemplatesView
              templates={templates}
              onAddTemplate={handleAddTemplate}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showNewSaleModal && (
        <NewSaleModal
          products={products}
          onClose={() => setShowNewSaleModal(false)}
          onSaveSale={handleAddSale}
        />
      )}

      {showNewExpenseModal && (
        <NewExpenseModal
          products={products}
          pricingRecords={pricingRecords}
          onClose={() => setShowNewExpenseModal(false)}
          onSaveExpense={handleAddExpense}
        />
      )}

      {showNewProductModal && (
        <NewProductModal
          onClose={() => setShowNewProductModal(false)}
          onSaveProduct={handleAddProduct}
        />
      )}

      <AIAssistantModal
        isOpen={showAIAssistantModal}
        onClose={() => setShowAIAssistantModal(false)}
        onOpenSettings={() => {
          setShowAIAssistantModal(false);
          setShowAISettingsModal(true);
        }}
        products={products}
        sales={sales}
        metaExpenses={metaExpenses}
        settings={aiSettings}
      />

      <AISettingsModal
        isOpen={showAISettingsModal}
        onClose={() => setShowAISettingsModal(false)}
        settings={aiSettings}
        onSaveSettings={handleSaveAISettings}
      />

      {/* Floating AI Launcher */}
      <button
        onClick={() => setShowAIAssistantModal(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-indigo-600/40 flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all cursor-pointer group border border-white/20"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping"></span>
        </div>
        <span className="font-bold text-xs sm:text-sm tracking-wide hidden sm:inline">D'RAYO AI</span>
        <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-semibold hidden lg:inline">Asistente</span>
      </button>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-6 z-50 bg-slate-900 border border-blue-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

function AuthWrapper() {
  const { currentUser, loading, isGuestMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-200">Iniciando D'RAYO PRO Cloud...</p>
          <p className="text-xs text-slate-500">Conectando con base de datos en la nube</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !isGuestMode) {
    return <AuthScreen />;
  }

  return <DashboardApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}
