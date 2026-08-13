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
  notes?: string;
}

export interface DailySaleRecord {
  id: string;
  date: string; // Fecha: YYYY-MM-DD
  month: string; // Mes: e.g. "Agosto", "Julio", "Junio"
  platform: string; // Plataforma (Meta Ads, TikTok Ads, Google Ads, Orgánico, etc.)
  defaultProduct: string; // Producto por defecto
  dailySpend: number; // Gasto diario en S/
  salesCount: number; // Número de ventas
  cpa: number; // Costo por Adquisición (S/): Gasto diario / Número de ventas
  notes?: string;
}

export interface MetaAdExpense {
  id: string;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  transactionId: string;
  amount: number; // In S/ (PEN)
  currency: string; // PEN
  status: 'Pagado' | 'Fondos agregados';
  paymentMethod?: string;
  period: string; // e.g., '1/3/2026 - 1/4/2026'
  monthKey: string; // '2026-03', '2026-04', '2026-05', '2026-06'
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'Bienvenida' | 'Confirmación' | 'Pago Yape/Plin' | 'Envío' | 'Seguimiento';
  text: string;
}

export interface AISettings {
  provider: 'gemini' | 'openai';
  apiKey?: string;
  model: string; // e.g. 'gemini-3.6-flash' or 'gpt-4o' or 'gpt-4o-mini'
  temperature: number; // 0.0 to 1.0
  assistantName: string;
  systemInstruction?: string;
  enableWhatsAppSuggestions: boolean;
  enableStockAlerts: boolean;
  enableROASAnalysis: boolean;
}

export type TabType = 'dashboard' | 'sales' | 'inventory' | 'pricing' | 'meta_ads' | 'meta_export' | 'templates';
