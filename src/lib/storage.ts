import { Product, Sale, MetaAdExpense, WhatsAppTemplate, AISettings, DailySaleRecord, PricingCalculationRecord } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_TEMPLATES, INITIAL_DAILY_RECORDS, INITIAL_PRICING_RECORDS } from '../data/sampleData';
import { INITIAL_META_AD_EXPENSES } from '../data/metaInvoicesData';
import { api } from './api';

const STORAGE_KEYS = {
  PRODUCTS: 'drayo_products_v5_clean_zero',
  SALES: 'drayo_sales_v5_clean_zero',
  DAILY_RECORDS: 'drayo_daily_records_v5_clean_zero',
  META_EXPENSES: 'drayo_meta_expenses_v5_clean_zero',
  TEMPLATES: 'drayo_templates_v5_clean_zero',
  PRICING_RECORDS: 'drayo_pricing_records_v5_clean_zero',
  AI_SETTINGS: 'drayo_ai_settings_v5_clean_zero',
};

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

export function resetAllToDefaults(): void {
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.DAILY_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.META_EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  localStorage.removeItem(STORAGE_KEYS.PRICING_RECORDS);
}

// Sync all memory state to server DB
let syncDebounceTimer: any = null;
export function triggerServerDBSync(fullState: {
  products: Product[];
  sales: Sale[];
  dailyRecords: DailySaleRecord[];
  metaExpenses: MetaAdExpense[];
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
