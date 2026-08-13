import React, { useState, useEffect } from 'react';
import { Product, Sale, MetaAdExpense, WhatsAppTemplate, TabType, AISettings, DailySaleRecord } from './types';
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
  getStoredAISettings,
  saveStoredAISettings,
  resetAllToDefaults
} from './lib/storage';

import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { MetaAdsView } from './components/MetaAdsView';
import { InventoryView } from './components/InventoryView';
import { PricingCalculatorView } from './components/PricingCalculatorView';
import { MetaExportView } from './components/MetaExportView';
import { WhatsAppTemplatesView } from './components/WhatsAppTemplatesView';

import { NewSaleModal } from './components/NewSaleModal';
import { NewExpenseModal } from './components/NewExpenseModal';
import { NewProductModal } from './components/NewProductModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AISettingsModal } from './components/AISettingsModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Sidebar Layout State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Core Data State
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [sales, setSales] = useState<Sale[]>(getStoredSales);
  const [dailyRecords, setDailyRecords] = useState<DailySaleRecord[]>(getStoredDailyRecords);
  const [metaExpenses, setMetaExpenses] = useState<MetaAdExpense[]>(getStoredMetaExpenses);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(getStoredTemplates);
  const [aiSettings, setAiSettings] = useState<AISettings>(getStoredAISettings);

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

  // Sync state to local storage
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredSales(sales);
  }, [sales]);

  useEffect(() => {
    saveStoredDailyRecords(dailyRecords);
  }, [dailyRecords]);

  useEffect(() => {
    saveStoredMetaExpenses(metaExpenses);
  }, [metaExpenses]);

  useEffect(() => {
    saveStoredTemplates(templates);
  }, [templates]);

  useEffect(() => {
    saveStoredAISettings(aiSettings);
  }, [aiSettings]);

  const handleSaveAISettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    showToast(`Ajustes de IA guardados. Modelo activo: ${newSettings.model}`);
  };

  // Handlers for WhatsApp Daily Sale Records (Connected to Inventory & Dashboard)
  const handleAddDailyRecord = (newRecord: DailySaleRecord) => {
    setDailyRecords((prev) => [newRecord, ...prev]);

    // Automatically deduct stock in Inventory for the corresponding product
    setProducts((prevProds) => {
      return prevProds.map((p) => {
        if (p.name.trim().toLowerCase() === newRecord.defaultProduct.trim().toLowerCase()) {
          return { ...p, stock: Math.max(0, p.stock - newRecord.salesCount) };
        }
        return p;
      });
    });

    showToast(`¡Venta WhatsApp registrada! ${newRecord.salesCount} und. descontadas del inventario.`);
  };

  const handleDeleteDailyRecord = (recordId: string) => {
    const rec = dailyRecords.find((r) => r.id === recordId);
    if (rec) {
      // Restore stock in Inventory
      setProducts((prevProds) => {
        return prevProds.map((p) => {
          if (p.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase()) {
            return { ...p, stock: p.stock + rec.salesCount };
          }
          return p;
        });
      });
    }

    setDailyRecords((prev) => prev.filter((r) => r.id !== recordId));
    showToast('Registro de venta eliminado y stock devuelto al inventario.');
  };

  const handleDeleteBulkDailyRecords = (recordIds: string[]) => {
    const idsSet = new Set(recordIds);
    const recordsToDelete = dailyRecords.filter((r) => idsSet.has(r.id));

    setProducts((prevProds) => {
      let updated = [...prevProds];
      recordsToDelete.forEach((rec) => {
        updated = updated.map((p) => {
          if (p.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase()) {
            return { ...p, stock: p.stock + rec.salesCount };
          }
          return p;
        });
      });
      return updated;
    });

    setDailyRecords((prev) => prev.filter((r) => !idsSet.has(r.id)));
    showToast(`${recordIds.length} registros eliminados y stock ajustado en el inventario.`);
  };

  // Handlers for Sales
  const handleAddSale = (newSale: Sale) => {
    setSales([newSale, ...sales]);

    // Deduct stock for items in the sale
    setProducts((prevProds) => {
      return prevProds.map((p) => {
        const itemInSale = newSale.items.find((it) => it.productId === p.id);
        if (itemInSale) {
          return { ...p, stock: Math.max(0, p.stock - itemInSale.quantity) };
        }
        return p;
      });
    });

    showToast(`¡Venta #${newSale.id} registrada con éxito!`);
  };

  const handleUpdateSaleStatus = (saleId: string, status: Sale['status']) => {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status } : s))
    );
    showToast(`Estado del pedido #${saleId} actualizado a "${status}"`);
  };

  const handleDeleteSale = (saleId: string) => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    showToast(`Pedido #${saleId} eliminado`);
  };

  // Handlers for Products
  const handleAddProduct = (newProduct: Product) => {
    setProducts([...products, newProduct]);
    showToast(`Producto "${newProduct.name}" agregado al inventario`);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Producto eliminado del inventario');
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`Producto "${updatedProduct.name}" actualizado`);
  };

  const handleUpdateProductPrice = (productId: string, newSalePrice: number, newCostPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, salePrice: newSalePrice, costPrice: newCostPrice } : p))
    );
    showToast('Precio e insumos actualizados en inventario');
  };

  // Handlers for Meta Expenses
  const handleAddExpense = (newExpense: MetaAdExpense) => {
    setMetaExpenses([newExpense, ...metaExpenses]);
    showToast('Nuevo gasto de publicidad Meta Ads registrado');
  };

  // Handlers for Meta Export
  const handleMarkSalesAsExported = (saleIds: string[]) => {
    setSales((prev) =>
      prev.map((s) => (saleIds.includes(s.id) ? { ...s, metaEventExported: true } : s))
    );
    showToast(`¡${saleIds.length} eventos marcados como exportados a Meta Ads!`);
  };

  // Handlers for Templates
  const handleAddTemplate = (newTemplate: WhatsAppTemplate) => {
    setTemplates([...templates, newTemplate]);
    showToast('Plantilla de respuesta rápida guardada');
  };

  const handleResetData = () => {
    if (window.confirm('¿Deseas restablecer todos los datos a la configuración inicial por defecto?')) {
      resetAllToDefaults();
      setProducts(getStoredProducts());
      setSales(getStoredSales());
      setDailyRecords(getStoredDailyRecords());
      setMetaExpenses(getStoredMetaExpenses());
      setTemplates(getStoredTemplates());
      showToast('Datos restablecidos correctamente');
    }
  };

  // Consolidated High-level KPI metrics (Standard Sales + WhatsApp Sales)
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-100">
        
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          totalSalesRevenue={totalSalesRevenue}
          totalMetaAdSpend={totalMetaAdSpend}
          totalNetProfit={totalNetProfit}
          roas={roas}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenNewSaleModal={() => setShowNewSaleModal(true)}
          onOpenNewExpenseModal={() => setShowNewExpenseModal(true)}
          onOpenAIAssistant={() => setShowAIAssistantModal(true)}
          onOpenAISettings={() => setShowAISettingsModal(true)}
          onResetData={handleResetData}
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

          {activeTab === 'sales' && (
            <SalesView
              products={products}
              dailyRecords={dailyRecords}
              onAddDailyRecord={handleAddDailyRecord}
              onDeleteDailyRecord={handleDeleteDailyRecord}
              onDeleteBulkDailyRecords={handleDeleteBulkDailyRecords}
            />
          )}

          {activeTab === 'meta_ads' && (
            <MetaAdsView
              metaExpenses={metaExpenses}
              onAddExpense={handleAddExpense}
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
              onUpdateProductPrice={handleUpdateProductPrice}
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
