import { Product, Sale, MetaAdExpense, WhatsAppTemplate, AISettings, DailySaleRecord, PricingCalculationRecord, IndirectCost } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_TEMPLATES, INITIAL_DAILY_RECORDS, INITIAL_PRICING_RECORDS, INITIAL_INDIRECT_COSTS } from '../data/sampleData';
import { INITIAL_META_AD_EXPENSES } from '../data/metaInvoicesData';
import { api } from './api';

const STORAGE_KEYS = {
  PRODUCTS: 'drayo_products_v5_clean_zero',
  CATEGORIES: 'drayo_product_categories_v1',
  INDIRECT_CATEGORIES: 'drayo_indirect_categories_v1',
  SALES: 'drayo_sales_v5_clean_zero',
  DAILY_RECORDS: 'drayo_daily_records_v5_clean_zero',
  META_EXPENSES: 'drayo_meta_expenses_v5_clean_zero',
  TEMPLATES: 'drayo_templates_v5_clean_zero',
  PRICING_RECORDS: 'drayo_pricing_records_v5_clean_zero',
  INDIRECT_COSTS: 'drayo_indirect_costs_v5_clean_zero',
  AI_SETTINGS: 'drayo_ai_settings_v5_clean_zero',
};

export const DEFAULT_PRODUCT_CATEGORIES: string[] = [
  'Ropa / Poleras',
  'Hoodies & Polerones',
  'Camisetas Oversize',
  'Pantalones & Joggers',
  'Gorras & Accesorios',
  'Calzado & Zapatillas',
  'Edición Limitada',
];

export function getStoredCategories(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...DEFAULT_PRODUCT_CATEGORIES, ...parsed]));
      }
    }
    return DEFAULT_PRODUCT_CATEGORIES;
  } catch {
    return DEFAULT_PRODUCT_CATEGORIES;
  }
}

export function saveStoredCategories(categories: string[]): void {
  try {
    const unique = Array.from(new Set(categories.filter((c) => typeof c === 'string' && c.trim().length > 0)));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(unique));
  } catch (e) {
    console.warn('Failed to save categories:', e);
  }
}

export function registerCategory(newCategory: string): string[] {
  const trimmed = newCategory ? newCategory.trim() : '';
  if (!trimmed) return getStoredCategories();
  const current = getStoredCategories();
  if (!current.includes(trimmed)) {
    const updated = [...current, trimmed];
    saveStoredCategories(updated);
    return updated;
  }
  return current;
}

export const DEFAULT_INDIRECT_CATEGORIES: string[] = [
  'Alquiler',
  'Servicios',
  'Personal',
  'Software',
  'Logística Fija',
  'Financiero/Contable',
  'Mantenimiento',
  'Publicidad Fija',
  'Impuestos',
  'Otros',
];

export function getStoredIndirectCategories(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INDIRECT_CATEGORIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...DEFAULT_INDIRECT_CATEGORIES, ...parsed]));
      }
    }
    return DEFAULT_INDIRECT_CATEGORIES;
  } catch {
    return DEFAULT_INDIRECT_CATEGORIES;
  }
}

export function saveStoredIndirectCategories(categories: string[]): void {
  try {
    const unique = Array.from(new Set(categories.filter((c) => typeof c === 'string' && c.trim().length > 0)));
    localStorage.setItem(STORAGE_KEYS.INDIRECT_CATEGORIES, JSON.stringify(unique));
  } catch (e) {
    console.warn('Failed to save indirect categories:', e);
  }
}

export function registerIndirectCategory(newCategory: string): string[] {
  const trimmed = newCategory ? newCategory.trim() : '';
  if (!trimmed) return getStoredIndirectCategories();
  const current = getStoredIndirectCategories();
  if (!current.includes(trimmed)) {
    const updated = [...current, trimmed];
    saveStoredIndirectCategories(updated);
    return updated;
  }
  return current;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  model: 'gemini-3.6-flash',
  temperature: 0.7,
  assistantName: "D'RAYO AI",
  systemInstruction: "Eres 'D'RAYO AI', el asistente inteligente oficial de la marca D'RAYO (E-commerce de moda/ropa en Perú). Tu función es brindar asesoramiento estratégico de negocio, análisis financiero, cálculo de ROAS de Meta Ads, optimización de ventas por WhatsApp y gestión de inventarios.",
  enableWhatsAppSuggestions: true,
  enableStockAlerts: true,
  enableROASAnalysis: true,
  enableVoiceResponse: true,
  voiceSpeed: 1.0,
  voicePitch: 1.0,
};

export function getStoredAISettings(): AISettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
    return data ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(data) } : DEFAULT_AI_SETTINGS;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveStoredAISettings(settings: AISettings): void {
  localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(settings));
}

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function getStoredSales(): Sale[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveStoredSales(sales: Sale[]): void {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

export function getStoredDailyRecords(): DailySaleRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveStoredDailyRecords(records: DailySaleRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(records));
}

export function getStoredMetaExpenses(): MetaAdExpense[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.META_EXPENSES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveStoredMetaExpenses(expenses: MetaAdExpense[]): void {
  localStorage.setItem(STORAGE_KEYS.META_EXPENSES, JSON.stringify(expenses));
}

export function getStoredTemplates(): WhatsAppTemplate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : INITIAL_TEMPLATES;
  } catch {
    return INITIAL_TEMPLATES;
  }
}

export function saveStoredTemplates(templates: WhatsAppTemplate[]): void {
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function getStoredPricingRecords(): PricingCalculationRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRICING_RECORDS);
    return data ? JSON.parse(data) : INITIAL_PRICING_RECORDS;
  } catch {
    return INITIAL_PRICING_RECORDS;
  }
}

export function saveStoredPricingRecords(records: PricingCalculationRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.PRICING_RECORDS, JSON.stringify(records));
}

export function getStoredIndirectCosts(): IndirectCost[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INDIRECT_COSTS);
    return data ? JSON.parse(data) : INITIAL_INDIRECT_COSTS;
  } catch {
    return INITIAL_INDIRECT_COSTS;
  }
}

export function saveStoredIndirectCosts(costs: IndirectCost[]): void {
  localStorage.setItem(STORAGE_KEYS.INDIRECT_COSTS, JSON.stringify(costs));
}

export function resetAllToDefaults(): void {
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.DAILY_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.META_EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  localStorage.removeItem(STORAGE_KEYS.PRICING_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.INDIRECT_COSTS);
}

// Sync all memory state to server DB
let syncDebounceTimer: any = null;
export function triggerServerDBSync(fullState: {
  products: Product[];
  sales: Sale[];
  dailyRecords: DailySaleRecord[];
  metaExpenses: MetaAdExpense[];
  indirectCosts?: IndirectCost[];
  templates: WhatsAppTemplate[];
  pricingRecords?: PricingCalculationRecord[];
  aiSettings: AISettings;
}) {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    api.syncDatabase(fullState).catch((err) => {
      console.warn('Background sync failed:', err);
    });
  }, 1000);
}
