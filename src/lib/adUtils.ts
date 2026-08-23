import { DailySaleRecord } from '../types';

export interface ProductAdPreset {
  adId?: string;
  departments?: string[];
  dailySpend?: string;
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
        platform: latest.platform,
        imageUrl: latest.imageUrl,
      };
    }
  }

  // 3. Fallback deterministic preset
  return {
    adId: generateMetaAdId(productName),
    departments: ['Lima'],
    dailySpend: '25.00',
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
