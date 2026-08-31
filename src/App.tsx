import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, MetaAdExpense, WhatsAppTemplate, TabType, AISettings, DailySaleRecord, PricingCalculationRecord, IndirectCost } from './types';
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
  getStoredIndirectCosts,
  saveStoredIndirectCosts,
  getStoredAISettings,
  saveStoredAISettings,
  loadUnlimitedLocalState,
  resetAllToDefaults,
  DEFAULT_AI_SETTINGS,
} from './lib/storage';
import { INITIAL_PRODUCTS, INITIAL_TEMPLATES, INITIAL_PRICING_RECORDS, INITIAL_INDIRECT_COSTS } from './data/sampleData';
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
import { IndirectCostsView } from './components/IndirectCostsView';
import { MetaExportView } from './components/MetaExportView';
import { WhatsAppTemplatesView } from './components/WhatsAppTemplatesView';
import { DatabaseView } from './components/DatabaseView';

import { NewSaleModal } from './components/NewSaleModal';
import { NewExpenseModal } from './components/NewExpenseModal';
import { NewProductModal } from './components/NewProductModal';
import { NewComboModal } from './components/NewComboModal';
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
  const [indirectCosts, setIndirectCosts] = useState<IndirectCost[]>(getStoredIndirectCosts);
  const [aiSettings, setAiSettings] = useState<AISettings>(getStoredAISettings);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);

  // Cloud Synchronization State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Modals state
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewComboModal, setShowNewComboModal] = useState(false);
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

  // Initial load from IndexedDB unlimited storage on mount
  useEffect(() => {
    loadUnlimitedLocalState().then((state) => {
      if (state) {
        if (state.products && state.products.length > 0) setProducts(state.products);
        if (state.sales && state.sales.length > 0) setSales(state.sales);
        if (state.dailyRecords && state.dailyRecords.length > 0) setDailyRecords(state.dailyRecords);
        if (state.metaExpenses && state.metaExpenses.length > 0) setMetaExpenses(state.metaExpenses);
        if (state.templates && state.templates.length > 0) setTemplates(state.templates);
        if (state.pricingRecords && state.pricingRecords.length > 0) setPricingRecords(state.pricingRecords);
        if (state.indirectCosts && state.indirectCosts.length > 0) setIndirectCosts(state.indirectCosts);
        if (state.aiSettings) setAiSettings(state.aiSettings);
      }
    }).catch(console.warn);
  }, []);

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
        
        // Products
        if (cloudState.products !== undefined && Array.isArray(cloudState.products)) {
          setProducts(cloudState.products);
          saveStoredProducts(cloudState.products);
        }

        // Standard Sales
        if (cloudState.sales !== undefined && Array.isArray(cloudState.sales)) {
          setSales(cloudState.sales);
          saveStoredSales(cloudState.sales);
        }

        // Daily WhatsApp Sales Records
        if (cloudState.dailyRecords !== undefined && Array.isArray(cloudState.dailyRecords)) {
          setDailyRecords(cloudState.dailyRecords);
          saveStoredDailyRecords(cloudState.dailyRecords);
        }

        // Meta Ads Expenses (Directly set without resurrecting deleted records)
        if (cloudState.metaExpenses !== undefined && Array.isArray(cloudState.metaExpenses)) {
          setMetaExpenses(cloudState.metaExpenses);
          saveStoredMetaExpenses(cloudState.metaExpenses);
        }

        // WhatsApp Quick-Reply Templates
        if (cloudState.templates !== undefined && Array.isArray(cloudState.templates)) {
          setTemplates(cloudState.templates);
          saveStoredTemplates(cloudState.templates);
        }

        // Pricing Calculator History Records
        if (cloudState.pricingRecords !== undefined && Array.isArray(cloudState.pricingRecords)) {
          setPricingRecords(cloudState.pricingRecords);
          saveStoredPricingRecords(cloudState.pricingRecords);
        }

        // Indirect Costs (Costos Fijos e Indirectos)
        if (cloudState.indirectCosts !== undefined && Array.isArray(cloudState.indirectCosts)) {
          setIndirectCosts(cloudState.indirectCosts);
          saveStoredIndirectCosts(cloudState.indirectCosts);
        }

        // AI Settings
        if (cloudState.aiSettings) {
          setAiSettings(cloudState.aiSettings);
          saveStoredAISettings(cloudState.aiSettings);
        }

        setLastSyncTime(new Date());
        setIsSyncing(false);
        setIsCloudLoaded(true);
        setTimeout(() => {
          isApplyingRemoteSync.current = false;
        }, 100);
      },
      (err) => {
        console.warn('Firestore subscription notice:', err);
        setIsSyncing(false);
        setIsCloudLoaded(true);
      }
    );

    // If newly created user with no data in cloud, initialize with current local data (never wipe existing records!)
    loadUserCloudState(currentUser.uid).then((existingState) => {
      if (!existingState) {
        const initialPayload: Partial<UserCloudState> = {
          products: getStoredProducts(),
          sales: getStoredSales(),
          dailyRecords: getStoredDailyRecords(),
          metaExpenses: getStoredMetaExpenses(),
          templates: getStoredTemplates(),
          pricingRecords: getStoredPricingRecords(),
          indirectCosts: getStoredIndirectCosts(),
          aiSettings: getStoredAISettings(),
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
    const cloudPayload: Partial<UserCloudState> = customState
      ? { ...customState }
      : {
          products,
          sales,
          dailyRecords,
          metaExpenses,
          templates,
          pricingRecords,
          indirectCosts,
          aiSettings,
        };

    if (currentUser) {
      saveUserCloudState(currentUser.uid, cloudPayload)
        .then(() => setLastSyncTime(new Date()))
        .catch((err) => console.warn('Cloud save error:', err));
    }

    // Also sync to server database as a secondary fallback
    const fullServerPayload = {
      products: customState?.products !== undefined ? customState.products : products,
      sales: customState?.sales !== undefined ? customState.sales : sales,
      dailyRecords: customState?.dailyRecords !== undefined ? customState.dailyRecords : dailyRecords,
      metaExpenses: customState?.metaExpenses !== undefined ? customState.metaExpenses : metaExpenses,
      templates: customState?.templates !== undefined ? customState.templates : templates,
      pricingRecords: customState?.pricingRecords !== undefined ? customState.pricingRecords : pricingRecords,
      indirectCosts: customState?.indirectCosts !== undefined ? customState.indirectCosts : indirectCosts,
      aiSettings: customState?.aiSettings !== undefined ? customState.aiSettings : aiSettings,
    };
    api.syncDatabase(fullServerPayload).catch((err) => console.warn('Server fallback sync error:', err));
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
    setDailyRecords((prevRecords) => {
      // Find if record already exists by ID or by same (product + date) or same (adId + date)
      const cleanProd = newRecord.defaultProduct.trim().toLowerCase();
      const cleanAdId = (newRecord.adId || '').trim().toLowerCase();
      
      const existingIdx = prevRecords.findIndex(
        (r) =>
          r.id === newRecord.id ||
          (r.date === newRecord.date &&
            ((cleanAdId && (r.adId || '').trim().toLowerCase() === cleanAdId) ||
              r.defaultProduct.trim().toLowerCase() === cleanProd))
      );

      let updatedRecords: DailySaleRecord[];
      let salesDelta = newRecord.salesCount;

      if (existingIdx >= 0) {
        const existing = prevRecords[existingIdx];
        salesDelta = newRecord.salesCount - (existing.salesCount || 0);
        const merged: DailySaleRecord = {
          ...existing,
          ...newRecord,
          id: existing.id, // keep persistent ID
          dailySpend: newRecord.dailySpend !== undefined ? newRecord.dailySpend : existing.dailySpend,
          salesCount: newRecord.salesCount !== undefined ? newRecord.salesCount : existing.salesCount,
          department: newRecord.department || existing.department,
          imageUrl: newRecord.imageUrl || existing.imageUrl,
          adId: newRecord.adId || existing.adId,
        };
        updatedRecords = [...prevRecords];
        updatedRecords[existingIdx] = merged;
      } else {
        updatedRecords = [newRecord, ...prevRecords];
      }

      saveStoredDailyRecords(updatedRecords);

      setProducts((prevProducts) => {
        const updatedProducts = prevProducts.map((p) => {
          if (p.name.trim().toLowerCase() === cleanProd) {
            return { ...p, stock: Math.max(0, p.stock - salesDelta) };
          }
          return p;
        });
        saveStoredProducts(updatedProducts);
        persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
        return updatedProducts;
      });

      return updatedRecords;
    });
    showToast(`¡Registro guardado exitosamente en la base de datos!`);
  };

  const handleUpdateDailyRecord = (updatedRecord: DailySaleRecord) => {
    setDailyRecords((prevRecords) => {
      const oldRecord = prevRecords.find((r) => r.id === updatedRecord.id);
      let updatedRecords: DailySaleRecord[];
      if (oldRecord) {
        updatedRecords = prevRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
      } else {
        // If updating a record not yet in state, append it safely
        updatedRecords = [updatedRecord, ...prevRecords];
      }
      saveStoredDailyRecords(updatedRecords);

      if (oldRecord) {
        setProducts((prevProducts) => {
          const updatedProducts = prevProducts.map((p) => {
            let currentStock = p.stock;
            if (p.name.trim().toLowerCase() === oldRecord.defaultProduct.trim().toLowerCase()) {
              currentStock += oldRecord.salesCount;
            }
            if (p.name.trim().toLowerCase() === updatedRecord.defaultProduct.trim().toLowerCase()) {
              currentStock -= updatedRecord.salesCount;
            }
            return { ...p, stock: Math.max(0, currentStock) };
          });
          saveStoredProducts(updatedProducts);
          persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
          return updatedProducts;
        });
      } else {
        persistStateToCloud({ dailyRecords: updatedRecords });
      }

      return updatedRecords;
    });
    showToast(`¡Registro actualizado y sincronizado en la nube!`);
  };

  const handleDeleteDailyRecord = (recordId: string) => {
    setDailyRecords((prevRecords) => {
      const rec = prevRecords.find((r) => r.id === recordId);
      const updatedRecords = prevRecords.filter((r) => r.id !== recordId);
      saveStoredDailyRecords(updatedRecords);

      if (rec) {
        setProducts((prevProducts) => {
          const updatedProducts = prevProducts.map((p) => {
            if (p.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase()) {
              return { ...p, stock: p.stock + rec.salesCount };
            }
            return p;
          });
          saveStoredProducts(updatedProducts);
          persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
          return updatedProducts;
        });
      } else {
        persistStateToCloud({ dailyRecords: updatedRecords });
      }

      return updatedRecords;
    });
    showToast('Registro de venta eliminado y sincronizado.');
  };

  const handleDeleteBulkDailyRecords = (recordIds: string[]) => {
    const idsSet = new Set(recordIds);
    setDailyRecords((prevRecords) => {
      const recordsToDelete = prevRecords.filter((r) => idsSet.has(r.id));
      const updatedRecords = prevRecords.filter((r) => !idsSet.has(r.id));
      saveStoredDailyRecords(updatedRecords);

      setProducts((prevProducts) => {
        let updatedProducts = [...prevProducts];
        recordsToDelete.forEach((rec) => {
          updatedProducts = updatedProducts.map((p) => {
            if (p.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase()) {
              return { ...p, stock: p.stock + rec.salesCount };
            }
            return p;
          });
        });
        saveStoredProducts(updatedProducts);
        persistStateToCloud({ dailyRecords: updatedRecords, products: updatedProducts });
        return updatedProducts;
      });

      return updatedRecords;
    });
    showToast(`${recordIds.length} registros eliminados de la base de datos.`);
  };

  // Handlers for Standard Sales
  const handleAddSale = (newSale: Sale) => {
    setSales((prevSales) => {
      const updatedSales = [newSale, ...prevSales.filter((s) => s.id !== newSale.id)];
      saveStoredSales(updatedSales);

      setProducts((prevProducts) => {
        const updatedProducts = prevProducts.map((p) => {
          const itemInSale = newSale.items.find((it) => it.productId === p.id);
          if (itemInSale) {
            return { ...p, stock: Math.max(0, p.stock - itemInSale.quantity) };
          }
          return p;
        });
        saveStoredProducts(updatedProducts);
        persistStateToCloud({ sales: updatedSales, products: updatedProducts });
        return updatedProducts;
      });

      return updatedSales;
    });
    showToast(`¡Venta #${newSale.id} registrada en la base de datos!`);
  };

  const handleUpdateSaleStatus = (saleId: string, status: Sale['status']) => {
    setSales((prevSales) => {
      const updatedSales = prevSales.map((s) => (s.id === saleId ? { ...s, status } : s));
      saveStoredSales(updatedSales);
      persistStateToCloud({ sales: updatedSales });
      return updatedSales;
    });
    showToast(`Estado del pedido #${saleId} actualizado a "${status}"`);
  };

  const handleDeleteSale = (saleId: string) => {
    setSales((prevSales) => {
      const updatedSales = prevSales.filter((s) => s.id !== saleId);
      saveStoredSales(updatedSales);
      persistStateToCloud({ sales: updatedSales });
      return updatedSales;
    });
    showToast(`Pedido #${saleId} eliminado`);
  };

  // Handlers for Products
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prevProducts) => {
      const updated = [...prevProducts.filter((p) => p.id !== newProduct.id), newProduct];
      saveStoredProducts(updated);
      persistStateToCloud({ products: updated });
      return updated;
    });
    showToast(`Producto "${newProduct.name}" agregado al inventario en la nube`);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prevProducts) => {
      const updated = prevProducts.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
      saveStoredProducts(updated);
      persistStateToCloud({ products: updated });
      return updated;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prevProducts) => {
      const updated = prevProducts.filter((p) => p.id !== productId);
      saveStoredProducts(updated);
      persistStateToCloud({ products: updated });
      return updated;
    });
    showToast('Producto eliminado del inventario');
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prevProducts) => {
      const updated = prevProducts.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      saveStoredProducts(updated);
      persistStateToCloud({ products: updated });
      return updated;
    });
    showToast(`Producto "${updatedProduct.name}" actualizado`);
  };

  const handleUpdateProductPrice = (productId: string, newSalePrice: number, newCostPrice: number) => {
    setProducts((prevProducts) => {
      const updated = prevProducts.map((p) => (p.id === productId ? { ...p, salePrice: newSalePrice, costPrice: newCostPrice } : p));
      saveStoredProducts(updated);
      persistStateToCloud({ products: updated });
      return updated;
    });
    showToast('Precio e insumos actualizados en inventario');
  };

  // Handlers for Meta Expenses
  const handleAddExpense = (newExpense: MetaAdExpense) => {
    setMetaExpenses((prevExpenses) => {
      const updated = [newExpense, ...prevExpenses.filter((e) => e.id !== newExpense.id)];
      saveStoredMetaExpenses(updated);
      persistStateToCloud({ metaExpenses: updated });
      return updated;
    });
    api.saveMetaExpense(newExpense).catch(console.warn);
    showToast('Nuevo gasto de publicidad Meta Ads registrado');
  };

  const handleDeleteExpense = (expenseId: string) => {
    setMetaExpenses((prevExpenses) => {
      const updated = prevExpenses.filter((e) => e.id !== expenseId);
      saveStoredMetaExpenses(updated);
      persistStateToCloud({ metaExpenses: updated });
      return updated;
    });
    api.deleteMetaExpense(expenseId).catch(console.warn);
    showToast('Gasto publicitario eliminado de la base de datos');
  };

  const handleBulkDeleteExpenses = (expenseIds: string[]) => {
    const idsSet = new Set(expenseIds);
    setMetaExpenses((prevExpenses) => {
      const updated = prevExpenses.filter((e) => !idsSet.has(e.id));
      saveStoredMetaExpenses(updated);
      persistStateToCloud({ metaExpenses: updated });
      return updated;
    });
    api.deleteBulkMetaExpenses(expenseIds).catch(console.warn);
    showToast(`${expenseIds.length} gastos publicitarios eliminados`);
  };

  // Handlers for Meta Export
  const handleMarkSalesAsExported = (saleIds: string[]) => {
    setSales((prevSales) => {
      const updated = prevSales.map((s) => (saleIds.includes(s.id) ? { ...s, metaEventExported: true } : s));
      saveStoredSales(updated);
      persistStateToCloud({ sales: updated });
      return updated;
    });
    showToast(`¡${saleIds.length} eventos marcados como exportados a Meta Ads!`);
  };

  // Handlers for Templates
  const handleAddTemplate = (newTemplate: WhatsAppTemplate) => {
    setTemplates((prevTemplates) => {
      const updated = [...prevTemplates.filter((t) => t.id !== newTemplate.id), newTemplate];
      saveStoredTemplates(updated);
      persistStateToCloud({ templates: updated });
      return updated;
    });
    showToast('Plantilla de respuesta rápida guardada');
  };

  // Handlers for Pricing Calculations Records
  const handleAddPricingRecord = (newRecord: PricingCalculationRecord) => {
    setPricingRecords((prevRecords) => {
      const filtered = prevRecords.filter((r) => r.id !== newRecord.id);
      const updated = [newRecord, ...filtered];
      saveStoredPricingRecords(updated);
      persistStateToCloud({ pricingRecords: updated });
      return updated;
    });
    showToast(`¡Cálculo "${newRecord.title}" guardado en la base de datos!`);
  };

  const handleDeletePricingRecord = (recordId: string) => {
    setPricingRecords((prevRecords) => {
      const updated = prevRecords.filter((r) => r.id !== recordId);
      saveStoredPricingRecords(updated);
      persistStateToCloud({ pricingRecords: updated });
      return updated;
    });
    showToast('Registro de cálculo eliminado');
  };

  const handleBulkDeletePricingRecords = (recordIds: string[]) => {
    const idsSet = new Set(recordIds);
    setPricingRecords((prevRecords) => {
      const updated = prevRecords.filter((r) => !idsSet.has(r.id));
      saveStoredPricingRecords(updated);
      persistStateToCloud({ pricingRecords: updated });
      return updated;
    });
    showToast(`${recordIds.length} registros de cálculos eliminados.`);
  };

  // Handlers for Indirect Costs (Costos Fijos / Indirectos)
  const handleAddIndirectCost = (cost: IndirectCost) => {
    setIndirectCosts((prevCosts) => {
      const updated = [cost, ...prevCosts.filter((c) => c.id !== cost.id)];
      saveStoredIndirectCosts(updated);
      persistStateToCloud({ indirectCosts: updated });
      return updated;
    });
    showToast('Nuevo costo indirecto registrado');
  };

  const handleUpdateIndirectCost = (updatedCost: IndirectCost) => {
    setIndirectCosts((prevCosts) => {
      const updated = prevCosts.map((c) => (c.id === updatedCost.id ? updatedCost : c));
      saveStoredIndirectCosts(updated);
      persistStateToCloud({ indirectCosts: updated });
      return updated;
    });
    showToast('Costo indirecto actualizado');
  };

  const handleDeleteIndirectCost = (costId: string) => {
    setIndirectCosts((prevCosts) => {
      const updated = prevCosts.filter((c) => c.id !== costId);
      saveStoredIndirectCosts(updated);
      persistStateToCloud({ indirectCosts: updated });
      return updated;
    });
    showToast('Costo indirecto eliminado');
  };

  const handleBulkDeleteIndirectCosts = (costIds: string[]) => {
    const idsSet = new Set(costIds);
    setIndirectCosts((prevCosts) => {
      const updated = prevCosts.filter((c) => !idsSet.has(c.id));
      saveStoredIndirectCosts(updated);
      persistStateToCloud({ indirectCosts: updated });
      return updated;
    });
    showToast(`${costIds.length} costos indirectos eliminados.`);
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
        indirectCosts: INITIAL_INDIRECT_COSTS,
        aiSettings: DEFAULT_AI_SETTINGS,
      };
      setProducts(initialPayload.products);
      setSales(initialPayload.sales);
      setDailyRecords(initialPayload.dailyRecords);
      setMetaExpenses(initialPayload.metaExpenses);
      setTemplates(initialPayload.templates);
      setPricingRecords(initialPayload.pricingRecords);
      setIndirectCosts(initialPayload.indirectCosts);
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

  // Note: Gastos Meta is strictly an independent accounting ledger for recording payments to Meta.
  // Operational ad spend for sales analysis comes directly from WhatsApp Daily Records.
  const totalWhatsAppAdSpend = dailyRecords.reduce((acc, r) => acc + r.dailySpend, 0);
  const totalAdSpend = totalWhatsAppAdSpend;

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

  const totalMonthlyIndirectCosts = indirectCosts
    .filter((c) => c.isActive !== false)
    .reduce((acc, c) => {
      if (c.periodicity === 'Anual') return acc + c.amount / 12;
      return acc + c.amount;
    }, 0);

  const totalNetProfit = totalSalesRevenue - totalCOGS - totalAdSpend - totalMonthlyIndirectCosts;
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
              indirectCosts={indirectCosts}
              pricingRecords={pricingRecords}
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
              indirectCosts={indirectCosts}
              aiSettings={aiSettings}
              onRefreshAllData={handleRefreshAllData}
              showToast={showToast}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              products={products}
              dailyRecords={dailyRecords}
              pricingRecords={pricingRecords}
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
              onBulkDeleteExpenses={handleBulkDeleteExpenses}
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
              onOpenNewComboModal={() => setShowNewComboModal(true)}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingCalculatorView
              products={products}
              pricingRecords={pricingRecords}
              indirectCosts={indirectCosts}
              onAddIndirectCost={handleAddIndirectCost}
              onUpdateIndirectCost={handleUpdateIndirectCost}
              onDeleteIndirectCost={handleDeleteIndirectCost}
              onAddPricingRecord={handleAddPricingRecord}
              onDeletePricingRecord={handleDeletePricingRecord}
              onBulkDeletePricingRecords={handleBulkDeletePricingRecords}
              onUpdateProductPrice={handleUpdateProductPrice}
              setActiveTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === 'indirect_costs' && (
            <IndirectCostsView
              indirectCosts={indirectCosts}
              onAddIndirectCost={handleAddIndirectCost}
              onUpdateIndirectCost={handleUpdateIndirectCost}
              onDeleteIndirectCost={handleDeleteIndirectCost}
              onBulkDeleteIndirectCosts={handleBulkDeleteIndirectCosts}
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
          existingCategories={Array.from(new Set(products.map((p) => p.category).filter(Boolean)))}
        />
      )}

      {showNewComboModal && (
        <NewComboModal
          products={products}
          onClose={() => setShowNewComboModal(false)}
          onSaveProduct={handleAddProduct}
          existingCategories={Array.from(new Set(products.map((p) => p.category).filter(Boolean)))}
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
