import fs from "fs";
import path from "path";
import { Product, Sale, DailySaleRecord, MetaAdExpense, WhatsAppTemplate, AISettings, PricingCalculationRecord, IndirectCost } from "../src/types";
import { INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_TEMPLATES, INITIAL_DAILY_RECORDS, INITIAL_PRICING_RECORDS, INITIAL_INDIRECT_COSTS } from "../src/data/sampleData";
import { INITIAL_META_AD_EXPENSES } from "../src/data/metaInvoicesData";

export interface DatabaseBackup {
  id: string;
  timestamp: string;
  label: string;
  recordCount: number;
  sizeBytes: number;
  data: DatabaseSchema;
}

export interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  products: Product[];
  sales: Sale[];
  dailyRecords: DailySaleRecord[];
  metaExpenses: MetaAdExpense[];
  indirectCosts?: IndirectCost[];
  templates: WhatsAppTemplate[];
  pricingRecords: PricingCalculationRecord[];
  aiSettings: AISettings;
  backups?: DatabaseBackup[];
}

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: "gemini",
  model: "gemini-3.6-flash",
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

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");

// In-memory cache for fast lookups
let inMemoryDb: DatabaseSchema | null = null;

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function getInitialDatabase(): DatabaseSchema {
  return {
    version: 2,
    lastUpdated: new Date().toISOString(),
    products: INITIAL_PRODUCTS,
    sales: INITIAL_SALES || [],
    dailyRecords: INITIAL_DAILY_RECORDS,
    metaExpenses: INITIAL_META_AD_EXPENSES,
    indirectCosts: INITIAL_INDIRECT_COSTS,
    templates: INITIAL_TEMPLATES,
    pricingRecords: INITIAL_PRICING_RECORDS,
    aiSettings: DEFAULT_AI_SETTINGS,
    backups: [],
  };
}

export function loadDatabase(): DatabaseSchema {
  ensureDirectories();

  if (inMemoryDb) {
    return inMemoryDb;
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const rawData = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(rawData) as DatabaseSchema;
      
      // Ensure all fields exist
      inMemoryDb = {
        version: parsed.version || 2,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        products: Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS,
        sales: Array.isArray(parsed.sales) ? parsed.sales : [],
        dailyRecords: Array.isArray(parsed.dailyRecords) ? parsed.dailyRecords : INITIAL_DAILY_RECORDS,
        metaExpenses: Array.isArray(parsed.metaExpenses) ? parsed.metaExpenses : INITIAL_META_AD_EXPENSES,
        indirectCosts: Array.isArray(parsed.indirectCosts) ? parsed.indirectCosts : INITIAL_INDIRECT_COSTS,
        templates: Array.isArray(parsed.templates) ? parsed.templates : INITIAL_TEMPLATES,
        pricingRecords: Array.isArray(parsed.pricingRecords) ? parsed.pricingRecords : INITIAL_PRICING_RECORDS,
        aiSettings: parsed.aiSettings ? { ...DEFAULT_AI_SETTINGS, ...parsed.aiSettings } : DEFAULT_AI_SETTINGS,
        backups: Array.isArray(parsed.backups) ? parsed.backups : [],
      };
      return inMemoryDb;
    } catch (err) {
      console.error("Error reading database file, initializing fresh database:", err);
    }
  }

  // Initialize fresh database and save to disk
  inMemoryDb = getInitialDatabase();
  saveDatabaseToDisk(inMemoryDb);
  return inMemoryDb;
}

export function saveDatabaseToDisk(data: DatabaseSchema): boolean {
  ensureDirectories();
  try {
    data.lastUpdated = new Date().toISOString();
    inMemoryDb = data;
    
    // Atomic write using temp file
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error("Failed to write to database file:", err);
    return false;
  }
}

// Database stats helper
export function getDatabaseStats() {
  const db = loadDatabase();
  let fileSizeKb = 0;
  try {
    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      fileSizeKb = Math.round((stats.size / 1024) * 10) / 10;
    }
  } catch {}

  const totalRecords =
    db.products.length +
    db.sales.length +
    db.dailyRecords.length +
    db.metaExpenses.length +
    (db.indirectCosts?.length || 0) +
    db.templates.length +
    (db.pricingRecords?.length || 0);

  return {
    status: "online",
    engine: "D'RAYO Persistent Relational Engine v2.0 (Node.js JSON/SQLite)",
    version: db.version,
    location: DB_FILE,
    fileSizeKb,
    lastUpdated: db.lastUpdated,
    totalRecords,
    tables: {
      products: { count: db.products.length, name: "Productos e Inventario" },
      sales: { count: db.sales.length, name: "Ventas WhatsApp y Pedidos" },
      dailyRecords: { count: db.dailyRecords.length, name: "Registros Diarios CPA" },
      metaExpenses: { count: db.metaExpenses.length, name: "Gastos Meta Ads" },
      indirectCosts: { count: db.indirectCosts?.length || 0, name: "Costos Indirectos y Fijos" },
      templates: { count: db.templates.length, name: "Plantillas WhatsApp" },
      pricingRecords: { count: db.pricingRecords?.length || 0, name: "Cálculos de Precios & Cuotas" },
      aiSettings: { count: 1, name: "Configuración de IA" },
    },
    backupsCount: db.backups?.length || 0,
  };
}

// Create Snapshot Backup
export function createDatabaseBackup(label?: string): DatabaseBackup {
  const db = loadDatabase();
  const backupId = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  
  const totalRecords =
    db.products.length +
    db.sales.length +
    db.dailyRecords.length +
    db.metaExpenses.length +
    (db.indirectCosts?.length || 0) +
    db.templates.length +
    (db.pricingRecords?.length || 0);

  const dataSnapshot: DatabaseSchema = {
    version: db.version,
    lastUpdated: db.lastUpdated,
    products: JSON.parse(JSON.stringify(db.products)),
    sales: JSON.parse(JSON.stringify(db.sales)),
    dailyRecords: JSON.parse(JSON.stringify(db.dailyRecords)),
    metaExpenses: JSON.parse(JSON.stringify(db.metaExpenses)),
    indirectCosts: JSON.parse(JSON.stringify(db.indirectCosts || [])),
    templates: JSON.parse(JSON.stringify(db.templates)),
    pricingRecords: JSON.parse(JSON.stringify(db.pricingRecords || [])),
    aiSettings: JSON.parse(JSON.stringify(db.aiSettings)),
  };

  const serialized = JSON.stringify(dataSnapshot);
  const sizeBytes = Buffer.byteLength(serialized, "utf-8");

  const backup: DatabaseBackup = {
    id: backupId,
    timestamp: now,
    label: label || `Respaldo automático ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`,
    recordCount: totalRecords,
    sizeBytes,
    data: dataSnapshot,
  };

  if (!db.backups) {
    db.backups = [];
  }
  // Keep last 15 backups
  db.backups = [backup, ...db.backups.slice(0, 14)];
  saveDatabaseToDisk(db);

  // Also save a physical backup file
  try {
    const backupFilePath = path.join(BACKUPS_DIR, `${backupId}.json`);
    fs.writeFileSync(backupFilePath, serialized, "utf-8");
  } catch (err) {
    console.error("Could not write physical backup file:", err);
  }

  return backup;
}

// Restore from Snapshot
export function restoreDatabaseBackup(backupId: string): boolean {
  const db = loadDatabase();
  const found = db.backups?.find((b) => b.id === backupId);
  if (!found) {
    // Check if physical file exists
    const backupFilePath = path.join(BACKUPS_DIR, `${backupId}.json`);
    if (fs.existsSync(backupFilePath)) {
      try {
        const raw = fs.readFileSync(backupFilePath, "utf-8");
        const restoredData = JSON.parse(raw) as DatabaseSchema;
        return saveDatabaseToDisk({
          ...restoredData,
          backups: db.backups || [],
        });
      } catch {}
    }
    return false;
  }

  const restored: DatabaseSchema = {
    ...found.data,
    lastUpdated: new Date().toISOString(),
    backups: db.backups, // preserve backups history
  };

  return saveDatabaseToDisk(restored);
}

// Reset Database to Seed defaults
export function resetDatabaseToDefaults(): DatabaseSchema {
  const fresh = getInitialDatabase();
  const currentDb = loadDatabase();
  
  // Preserve backups history even on reset
  fresh.backups = currentDb.backups || [];
  
  saveDatabaseToDisk(fresh);
  return fresh;
}
