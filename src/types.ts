export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number; // Costo por unidad S/
  salePrice: number; // Precio de venta S/
  stock: number;
  minStock: number;
  imageUrl?: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // Precio de venta aplicado
  costPrice: number; // Costo unitario
}

export interface Sale {
  id: string;
  adId?: string; // ID de anuncio (Meta Ads, TikTok Ads, etc.)
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  items: SaleItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: 'Yape' | 'Plin' | 'Transferencia Bancaria' | 'Efectivo' | 'Otro';
  status: 'Confirmada' | 'Entregada' | 'Cancelada' | 'En camino';
  metaEventExported: boolean;
  department?: string; // Departamento / Región
  notes?: string;
}

export interface DailySaleRecord {
  id: string;
  adId?: string; // ID del anuncio (ej: Meta Ad ID / Código de Anuncio)
  date: string; // Fecha: YYYY-MM-DD
  month: string; // Mes: e.g. "Agosto", "Julio", "Junio"
  platform: string; // Plataforma (Meta Ads, TikTok Ads, Google Ads, Orgánico, etc.)
  defaultProduct: string; // Producto por defecto
  department?: string; // Departamento / Región de destino o ventas
  dailySpend: number; // Gasto diario en S/
  salesCount: number; // Número de ventas
  cpa: number; // Costo por Adquisición (S/): Gasto diario / Número de ventas
  notes?: string;
}

export interface MetaAdExpense {
  id: string;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  transactionId: string;
  adAccount?: string; // Cuenta publicitaria (e.g. "D'RAYO (1334036197186369)")
  productId?: string; // ID del producto asociado
  productName?: string; // Nombre del producto (autocompletado desde Calculadora o Catálogo)
  cpaTarget?: number; // CPA objetivo derivado de la calculadora
  amount: number; // In S/ (PEN)
  currency: string; // PEN
  status: 'Pagado' | 'Fondos agregados';
  paymentMethod?: string;
  period: string; // e.g., '1/3/2026 - 1/4/2026'
  monthKey: string; // '2026-03', '2026-04', '2026-05', '2026-06'
  notes?: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'Bienvenida' | 'Confirmación' | 'Pago Yape/Plin' | 'Envío' | 'Seguimiento';
  text: string;
}

export interface PricingCalculationRecord {
  id: string;
  type: 'individual' | 'combo' | 'personal_budget' | string;
  title: string;
  createdAt?: string;
  date?: string; // YYYY-MM-DD
  productId?: string;
  productName?: string;
  // Costs breakdown
  productCostPrice?: number;
  costPrice?: number;
  cpa?: number;
  shipping?: number;
  packaging?: number;
  extraCost?: number;
  personalExpenseQuota?: number;
  // Sale & results
  salePrice?: number;
  totalCost?: number;
  netProfit?: number;
  netMarginPercent?: number;
  roi?: number;
  minRoas?: number;
  targetMarginPercent?: number;
  // For Combos
  comboTitle?: string;
  comboItems?: {
    id?: string;
    productId?: string;
    name: string;
    quantity: number;
    costPrice: number;
    regularSalePrice: number;
  }[];
  regularRetailPrice?: number;
  regularRetailTotal?: number;
  discountPercent?: number;
  savingsAmount?: number;
  // For Personal Budget simulation
  totalPersonalBudget?: number;
  monthlyPersonalBudgetTotal?: number;
  monthlyEstimatedSales?: number;
  monthlyEstimatedUnits?: number;
  breakEvenUnits?: number;
  breakdownItems?: {
    category: string;
    name: string;
    amount: number;
  }[];
  notes?: string;
}

export interface AISettings {
  provider: 'gemini' | 'openai';
  apiKey?: string;
  geminiApiKey?: string;
  openAiApiKey?: string;
  model: string; // e.g. 'gemini-3.6-flash' or 'gpt-4o' or 'gpt-4o-mini'
  temperature: number; // 0.0 to 1.0
  assistantName: string;
  systemInstruction?: string;
  responseMode?: 'text' | 'voice' | 'both'; // Mode of AI output
  enableWhatsAppSuggestions: boolean;
  enableStockAlerts: boolean;
  enableROASAnalysis: boolean;
  enableVoiceResponse?: boolean; // Autoplay voice on new responses
  voiceSpeed?: number; // 0.8 - 1.5
  voicePitch?: number; // 0.8 - 1.2
  voiceGender?: 'female' | 'male';
  voiceName?: string;
}

export interface DatabaseTableStats {
  count: number;
  name: string;
}

export interface DatabaseBackup {
  id: string;
  timestamp: string;
  label: string;
  recordCount: number;
  sizeBytes: number;
}

export interface DatabaseStatus {
  status: 'online' | 'syncing' | 'offline' | 'error';
  engine: string;
  version: number;
  location: string;
  fileSizeKb: number;
  lastUpdated: string;
  totalRecords: number;
  tables: {
    products: DatabaseTableStats;
    sales: DatabaseTableStats;
    dailyRecords: DatabaseTableStats;
    metaExpenses: DatabaseTableStats;
    templates: DatabaseTableStats;
    pricingRecords: DatabaseTableStats;
    aiSettings: DatabaseTableStats;
  };
  backupsCount: number;
}

export type TabType = 'dashboard' | 'sales' | 'inventory' | 'pricing' | 'meta_ads' | 'meta_export' | 'templates' | 'database';
