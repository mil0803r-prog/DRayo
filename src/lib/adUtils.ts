import { DailySaleRecord, Product, PricingCalculationRecord } from '../types';

export interface ProductAdPreset {
  adId?: string;
  departments?: string[];
  dailySpend?: string;
  unitPrice?: string | number;
  unitCost?: string | number;
  platform?: string;
  imageUrl?: string;
  lastUpdated?: string;
}

const PRESETS_STORAGE_KEY = 'remix_meta_product_presets';

/**
 * Reads stored presets from localStorage
 */
export function getAllSavedPresets(): Record<string, ProductAdPreset> {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Saves a product preset into persistent localStorage
 */
export function saveProductAdPreset(
  productName: string,
  preset: ProductAdPreset
): void {
  if (!productName || !productName.trim()) return;
  const key = productName.trim().toLowerCase();
  try {
    const current = getAllSavedPresets();
    current[key] = {
      ...current[key],
      ...preset,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Could not save preset to localStorage:', err);
  }
}

/**
 * Generates a realistic Meta Ads ID (e.g. 12028491023)
 * If a seed string (like product name) is given, generates a deterministic ID so the same product gets the same default ID.
 */
export function generateMetaAdId(seed?: string): string {
  if (seed && seed.trim()) {
    let hash = 0;
    const str = seed.trim().toLowerCase();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const positiveNum = Math.abs(hash);
    const suffix = (positiveNum % 90000000) + 10000000; // 8 digits (10000000 - 99999999)
    return `1202${suffix}`;
  }
  
  // Random 8-digit suffix
  const randSuffix = Math.floor(10000000 + Math.random() * 90000000);
  return `1202${randSuffix}`;
}

/**
 * Finds user saved presets for a product, checking:
 * 1. Explicitly saved localStorage presets
 * 2. Most recent daily records matching this product
 * 3. Deterministic generated fallback
 */
export function getProductPreset(
  productName?: string,
  existingRecords?: DailySaleRecord[]
): ProductAdPreset {
  if (!productName || !productName.trim()) {
    return {
      adId: generateMetaAdId(),
      departments: ['Lima'],
      dailySpend: '25.00',
      unitPrice: '99.00',
    };
  }

  const clean = productName.trim().toLowerCase();
  
  // 1. Check persistent saved presets
  const savedPresets = getAllSavedPresets();
  const directPreset = savedPresets[clean];
  if (directPreset && directPreset.adId) {
    return directPreset;
  }

  // 2. Check existing records for this product (most recent first)
  if (existingRecords && existingRecords.length > 0) {
    const matchingRecords = existingRecords.filter(
      (r) => r.defaultProduct && r.defaultProduct.trim().toLowerCase() === clean
    );
    if (matchingRecords.length > 0) {
      // sort by date descending
      const sorted = [...matchingRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const latest = sorted[0];
      const depts = latest.department
        ? latest.department.split(',').map((d) => d.trim()).filter(Boolean)
        : ['Lima'];

      return {
        adId: latest.adId?.trim() || generateMetaAdId(productName),
        departments: depts.length > 0 ? depts : ['Lima'],
        dailySpend: latest.dailySpend !== undefined ? latest.dailySpend.toFixed(2) : '25.00',
        unitPrice: latest.unitPrice !== undefined ? latest.unitPrice.toFixed(2) : undefined,
        unitCost: latest.unitCost !== undefined ? latest.unitCost.toFixed(2) : undefined,
        platform: latest.platform,
        imageUrl: latest.imageUrl,
      };
    }
  }

  // 3. Fallback deterministic preset with smart price detection
  let defaultPrice = '99.00';
  if (clean.includes('baño') || clean.includes('combo')) {
    defaultPrice = '99.00';
  }

  return {
    adId: generateMetaAdId(productName),
    departments: ['Lima'],
    dailySpend: '25.00',
    unitPrice: defaultPrice,
  };
}

/**
 * Finds existing Ad ID for a given product or returns a predetermined Meta Ad ID
 */
export function getDefaultAdIdForProduct(
  productName?: string,
  existingRecords?: DailySaleRecord[]
): string {
  const preset = getProductPreset(productName, existingRecords);
  return preset.adId || generateMetaAdId(productName || 'default_ad');
}

/**
 * Resolves the exact unit price, unit cost, revenue, COGS, profit and ROAS for any DailySaleRecord
 */
export function resolveRecordPriceAndCost(
  rec: {
    defaultProduct?: string;
    unitPrice?: number;
    unitCost?: number;
    salesCount?: number;
    dailySpend?: number;
  },
  products: Product[] = [],
  pricingRecords: PricingCalculationRecord[] = []
): {
  unitPrice: number;
  unitCost: number;
  revenue: number;
  cogs: number;
  profit: number;
  roas: number;
} {
  const cleanName = (rec.defaultProduct || '').trim().toLowerCase();
  const salesCount = Number(rec.salesCount) || 0;
  const dailySpend = Number(rec.dailySpend) || 0;

  // 1. Determine Unit Price
  let unitPrice = 0;
  if (rec.unitPrice !== undefined && Number(rec.unitPrice) > 0) {
    unitPrice = Number(rec.unitPrice);
  } else {
    // A. Check exact or fuzzy matching product in catalog
    const exactProduct = products.find((p) => p.name.trim().toLowerCase() === cleanName);
    if (exactProduct && exactProduct.salePrice > 0) {
      unitPrice = exactProduct.salePrice;
    } else {
      const fuzzyProduct = products.find((p) => {
        const pName = p.name.trim().toLowerCase();
        return cleanName.length >= 3 && (pName.includes(cleanName) || cleanName.includes(pName));
      });
      if (fuzzyProduct && fuzzyProduct.salePrice > 0) {
        unitPrice = fuzzyProduct.salePrice;
      } else {
        // B. Check in pricingRecords (Calculadora de Márgenes / Combos guardados)
        const pricing = pricingRecords.find((pr) => {
          const prName = (pr.productName || pr.title || '').trim().toLowerCase();
          return prName === cleanName || (cleanName.length >= 3 && (prName.includes(cleanName) || cleanName.includes(prName)));
        });
        if (pricing && pricing.salePrice) {
          unitPrice = Number(pricing.salePrice || 0);
        } else {
          // C. Check if product name explicitly mentions a number like "99", "combo 99", "s/ 99"
          const matchPrice = cleanName.match(/\b(?:s\/?\.?\s*)?(\d+(?:\.\d{1,2})?)\s*(?:soles|so?l|pen)?\b/i);
          if (matchPrice && parseFloat(matchPrice[1]) > 0 && parseFloat(matchPrice[1]) <= 2000) {
            unitPrice = parseFloat(matchPrice[1]);
          } else if (cleanName.includes('baño') || cleanName.includes('combo')) {
            unitPrice = 99.0;
          } else {
            // Check persistent preset
            const presets = getAllSavedPresets();
            const saved = presets[cleanName];
            if (saved && saved.unitPrice && Number(saved.unitPrice) > 0) {
              unitPrice = Number(saved.unitPrice);
            } else {
              unitPrice = products[0]?.salePrice || 99.0;
            }
          }
        }
      }
    }
  }

  // 2. Determine Unit Cost (COGS)
  let unitCost = 0;
  if (rec.unitCost !== undefined && Number(rec.unitCost) > 0) {
    unitCost = Number(rec.unitCost);
  } else {
    const exactProduct = products.find((p) => p.name.trim().toLowerCase() === cleanName);
    if (exactProduct && exactProduct.costPrice > 0) {
      unitCost = exactProduct.costPrice;
    } else {
      const fuzzyProduct = products.find((p) => {
        const pName = p.name.trim().toLowerCase();
        return cleanName.length >= 3 && (pName.includes(cleanName) || cleanName.includes(pName));
      });
      if (fuzzyProduct && fuzzyProduct.costPrice > 0) {
        unitCost = fuzzyProduct.costPrice;
      } else {
        const pricing = pricingRecords.find((pr) => {
          const prName = (pr.productName || pr.title || '').trim().toLowerCase();
          return prName === cleanName || (cleanName.length >= 3 && (prName.includes(cleanName) || cleanName.includes(prName)));
        });
        if (pricing && (pricing.productCostPrice || pricing.costPrice)) {
          unitCost = Number(pricing.productCostPrice || pricing.costPrice || 0);
        } else {
          const presets = getAllSavedPresets();
          const saved = presets[cleanName];
          if (saved && saved.unitCost && Number(saved.unitCost) > 0) {
            unitCost = Number(saved.unitCost);
          } else {
            // Estimate standard garment cost
            unitCost = products[0]?.costPrice || 35.0;
          }
        }
      }
    }
  }

  const revenue = salesCount * unitPrice;
  const cogs = salesCount * unitCost;
  const profit = revenue - dailySpend - cogs;
  const roas = dailySpend > 0 ? revenue / dailySpend : 0;

  return { unitPrice, unitCost, revenue, cogs, profit, roas };
}
