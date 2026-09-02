import React, { useState, useMemo } from 'react';
import { Sale, MetaAdExpense, Product, TabType, DailySaleRecord, IndirectCost, PricingCalculationRecord } from '../types';
import { resolveRecordPriceAndCost } from '../lib/adUtils';
import {
  DollarSign,
  TrendingUp,
  Megaphone,
  ShoppingCart,
  CheckCircle2,
  Package,
  Zap,
  Target,
  Scale,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  Receipt,
  Building2,
  ArrowRight,
  Filter,
  Info,
  Boxes,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Coins,
  PackageCheck,
  X,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';

interface DashboardViewProps {
  sales: Sale[];
  dailyRecords?: DailySaleRecord[];
  metaExpenses: MetaAdExpense[];
  indirectCosts?: IndirectCost[];
  pricingRecords?: PricingCalculationRecord[];
  products: Product[];
  setActiveTab: (tab: TabType) => void;
  onOpenAIAssistant?: () => void;
}

const MONTH_NAMES_SPANISH = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatMonthName = (monthKey: string) => {
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES_SPANISH[monthIdx]} ${year}`;
    }
  }
  return monthKey;
};

export type DashboardCardId =
  | 'total_sales'
  | 'cogs'
  | 'net_profit_sold'
  | 'net_profit_inventory'
  | 'ad_spend'
  | 'indirect_costs'
  | 'roas'
  | 'gross_profit'
  | 'net_profit';

const DEFAULT_DASHBOARD_CARD_ORDER: DashboardCardId[] = [
  'total_sales',
  'cogs',
  'ad_spend',
  'indirect_costs',
  'roas',
  'net_profit_inventory',
];

const ALL_AVAILABLE_CARD_DEFS: { id: DashboardCardId; title: string }[] = [
  { id: 'total_sales', title: 'Ventas Totales' },
  { id: 'cogs', title: 'Costo Prendas (COGS)' },
  { id: 'ad_spend', title: 'Gasto Publicidad (Meta Ads)' },
  { id: 'indirect_costs', title: 'Costos Indirectos (Fijos)' },
  { id: 'roas', title: 'ROAS Meta Ads' },
  { id: 'net_profit_inventory', title: 'Ganancia Neta Real (Bolsillo)' },
  { id: 'net_profit_sold', title: 'Ganancia Bruta (Prendas)' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  dailyRecords = [],
  metaExpenses,
  indirectCosts = [],
  pricingRecords = [],
  products,
  setActiveTab,
}) => {
  // Month selector filter: 'all' | 'YYYY-MM'
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  // Product selector filter: 'all' | productName
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  // Channel filter: 'all' | 'whatsapp' | 'standard'
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'standard'>('all');
  // Ad spend calculation mode: 'whatsapp' (uses daily records ad spend) | 'invoices' (uses metaExpenses) | 'combined'
  const [adSpendMode, setAdSpendMode] = useState<'whatsapp' | 'invoices' | 'combined'>('whatsapp');

  // Moveable / Drag-and-drop KPI cards order state
  const [cardOrder, setCardOrder] = useState<DashboardCardId[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard_kpi_card_order_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed
            .map((k) => {
              if (k === 'gross_profit') return 'net_profit_sold';
              if (k === 'net_profit') return 'net_profit_inventory';
              return k;
            })
            .filter((id) => id !== 'net_profit_sold'); // Exclude removed card
          const valid = mapped.filter((id: DashboardCardId) => DEFAULT_DASHBOARD_CARD_ORDER.includes(id));
          return valid.length > 0 ? [...new Set(valid)] as DashboardCardId[] : DEFAULT_DASHBOARD_CARD_ORDER;
        }
      }
    } catch (e) {
      console.warn('Could not read card order from localStorage', e);
    }
    return DEFAULT_DASHBOARD_CARD_ORDER;
  });

  const [draggedCardId, setDraggedCardId] = useState<DashboardCardId | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<DashboardCardId | null>(null);
  const [showAddCardMenu, setShowAddCardMenu] = useState(false);
  // Independent collapsible notes / dropdowns state for each KPI card
  const [expandedCardDetails, setExpandedCardDetails] = useState<Record<string, boolean>>({});

  const toggleCardDetail = (cardKey: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedCardDetails((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  const handleSaveCardOrder = (newOrder: DashboardCardId[]) => {
    setCardOrder(newOrder);
    try {
      localStorage.setItem('dashboard_kpi_card_order_v5', JSON.stringify(newOrder));
    } catch (e) {
      console.warn('Could not save card order to localStorage', e);
    }
  };

  const handleRemoveCard = (cardIdToRemove: DashboardCardId, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newOrder = cardOrder.filter((id) => id !== cardIdToRemove);
    handleSaveCardOrder(newOrder);
  };

  const handleAddCard = (cardIdToAdd: DashboardCardId) => {
    if (cardOrder.includes(cardIdToAdd)) return;
    const newOrder = [...cardOrder, cardIdToAdd];
    handleSaveCardOrder(newOrder);
    setShowAddCardMenu(false);
  };

  const moveCard = (fromId: DashboardCardId, toId: DashboardCardId) => {
    if (fromId === toId) return;
    const fromIndex = cardOrder.indexOf(fromId);
    const toIndex = cardOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const newOrder = [...cardOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    handleSaveCardOrder(newOrder);
  };

  const shiftCard = (cardId: DashboardCardId, direction: 'left' | 'right') => {
    const index = cardOrder.indexOf(cardId);
    if (index === -1) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cardOrder.length) return;
    const newOrder = [...cardOrder];
    const [item] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, item);
    handleSaveCardOrder(newOrder);
  };

  const handleResetCardOrder = () => {
    handleSaveCardOrder(DEFAULT_DASHBOARD_CARD_ORDER);
  };

  // Available Products Extraction (STRICTLY FROM VENTAS POR WHATSAPP dailyRecords)
  const availableProducts = useMemo(() => {
    const map = new Map<string, {
      name: string;
      source: string;
      salePrice: number;
      costPrice: number;
      unitsSold: number;
      revenue: number;
      adSpend: number;
      cogs: number;
    }>();

    dailyRecords.forEach((r) => {
      const name = (r.defaultProduct || '').trim();
      if (!name) return;

      const resolved = resolveRecordPriceAndCost(r, products, pricingRecords);
      const existing = map.get(name) || {
        name,
        source: 'Ventas WhatsApp',
        salePrice: resolved.unitPrice,
        costPrice: resolved.unitCost,
        unitsSold: 0,
        revenue: 0,
        adSpend: 0,
        cogs: 0,
      };

      existing.unitsSold += r.salesCount || 0;
      existing.revenue += resolved.revenue;
      existing.adSpend += r.dailySpend || 0;
      existing.cogs += resolved.cogs;
      existing.salePrice = resolved.unitPrice;
      existing.costPrice = resolved.unitCost;

      map.set(name, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [dailyRecords, products, pricingRecords]);

  // Selected product meta info
  const selectedProductInfo = useMemo(() => {
    if (selectedProduct === 'all') return null;
    return availableProducts.find((p) => p.name.toLowerCase() === selectedProduct.toLowerCase()) || null;
  }, [selectedProduct, availableProducts]);

  // Dynamic Month Keys Detection
  const dynamicMonthKeysSet = new Set<string>();
  ['2026-03', '2026-04', '2026-05', '2026-06'].forEach((k) => dynamicMonthKeysSet.add(k));

  metaExpenses.forEach((e) => {
    if (e.monthKey) dynamicMonthKeysSet.add(e.monthKey);
    if (e.date && e.date.length >= 7) dynamicMonthKeysSet.add(e.date.substring(0, 7));
  });

  dailyRecords.forEach((r) => {
    if (r.date && r.date.length >= 7) dynamicMonthKeysSet.add(r.date.substring(0, 7));
  });

  sales.forEach((s) => {
    if (s.date && s.date.length >= 7) dynamicMonthKeysSet.add(s.date.substring(0, 7));
  });

  indirectCosts.forEach((c) => {
    if (c.monthKey && c.monthKey !== 'all') dynamicMonthKeysSet.add(c.monthKey);
  });

  const sortedMonthKeys = Array.from(dynamicMonthKeysSet).sort();

  const months = sortedMonthKeys.map((key) => ({
    key,
    name: formatMonthName(key),
  }));

  // 1. Standard Sales Calculations (with product and month filters)
  const filteredStandardSales = useMemo(() => {
    if (channelFilter === 'whatsapp') return [];
    return sales.filter((s) => {
      const matchStatus = s.status !== 'Cancelada';
      const matchMonth = selectedMonth === 'all' || (s.date && s.date.startsWith(selectedMonth));
      const matchProduct =
        selectedProduct === 'all' ||
        s.items.some((it) => it.productName.trim().toLowerCase() === selectedProduct.trim().toLowerCase());
      return matchStatus && matchMonth && matchProduct;
    });
  }, [sales, channelFilter, selectedMonth, selectedProduct]);

  const totalStandardSalesRevenue = useMemo(() => {
    return filteredStandardSales.reduce((acc, s) => {
      if (selectedProduct === 'all') return acc + s.total;
      const productItems = s.items.filter(
        (it) => it.productName.trim().toLowerCase() === selectedProduct.trim().toLowerCase()
      );
      return acc + productItems.reduce((sum, it) => sum + (it.unitPrice || 0) * (it.quantity || 1), 0);
    }, 0);
  }, [filteredStandardSales, selectedProduct]);

  const totalStandardCOGS = useMemo(() => {
    return filteredStandardSales.reduce((acc, s) => {
      const items =
        selectedProduct === 'all'
          ? s.items
          : s.items.filter((it) => it.productName.trim().toLowerCase() === selectedProduct.trim().toLowerCase());
      const itemsCost = items.reduce((sum, item) => sum + (item.costPrice || 0) * (item.quantity || 1), 0);
      return acc + itemsCost;
    }, 0);
  }, [filteredStandardSales, selectedProduct]);

  const totalStandardUnitsSold = useMemo(() => {
    return filteredStandardSales.reduce((acc, s) => {
      const items =
        selectedProduct === 'all'
          ? s.items
          : s.items.filter((it) => it.productName.trim().toLowerCase() === selectedProduct.trim().toLowerCase());
      return acc + items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    }, 0);
  }, [filteredStandardSales, selectedProduct]);

  // 2. WhatsApp Daily Sales Calculations (with product and month filters)
  const filteredDailyRecords = useMemo(() => {
    if (channelFilter === 'standard') return [];
    return dailyRecords.filter((r) => {
      const matchMonth = selectedMonth === 'all' || (r.date && r.date.startsWith(selectedMonth));
      const matchProduct =
        selectedProduct === 'all' ||
        (r.defaultProduct && r.defaultProduct.trim().toLowerCase() === selectedProduct.trim().toLowerCase());
      return matchMonth && matchProduct;
    });
  }, [dailyRecords, channelFilter, selectedMonth, selectedProduct]);

  const resolvedDailyMetrics = useMemo(() => {
    return filteredDailyRecords.map((rec) => {
      const resolved = resolveRecordPriceAndCost(rec, products, pricingRecords);
      return {
        record: rec,
        ...resolved,
      };
    });
  }, [filteredDailyRecords, products, pricingRecords]);

  const totalWhatsAppDailyRevenue = useMemo(() => {
    return resolvedDailyMetrics.reduce((acc, item) => acc + item.revenue, 0);
  }, [resolvedDailyMetrics]);

  const totalWhatsAppDailyCOGS = useMemo(() => {
    return resolvedDailyMetrics.reduce((acc, item) => acc + item.cogs, 0);
  }, [resolvedDailyMetrics]);

  const totalWhatsAppAdSpend = useMemo(() => {
    return filteredDailyRecords.reduce((acc, r) => acc + (r.dailySpend || 0), 0);
  }, [filteredDailyRecords]);

  const totalWhatsAppUnitsSold = useMemo(() => {
    return filteredDailyRecords.reduce((acc, r) => acc + (r.salesCount || 0), 0);
  }, [filteredDailyRecords]);

  // 3. Meta Ads Facturación Calculations (with product and month filters)
  const filteredMetaExpenses = useMemo(() => {
    return metaExpenses.filter((e) => {
      const matchMonth =
        selectedMonth === 'all' || e.monthKey === selectedMonth || (e.date && e.date.startsWith(selectedMonth));
      const matchProduct =
        selectedProduct === 'all' ||
        (e.productName && e.productName.trim().toLowerCase() === selectedProduct.trim().toLowerCase());
      return matchMonth && matchProduct;
    });
  }, [metaExpenses, selectedMonth, selectedProduct]);

  const totalMetaFacturado = useMemo(() => {
    return filteredMetaExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredMetaExpenses]);

  // 4. Indirect & Fixed Costs Calculations
  const activeIndirectCosts = useMemo(() => {
    return indirectCosts.filter((c) => {
      if (c.isActive === false) return false;
      if (selectedMonth === 'all') return true;
      return !c.monthKey || c.monthKey === 'all' || c.monthKey === selectedMonth;
    });
  }, [indirectCosts, selectedMonth]);

  const totalIndirectCosts = useMemo(() => {
    return activeIndirectCosts.reduce((sum, c) => {
      if (c.periodicity === 'Anual') return sum + (c.amount || 0) / 12;
      return sum + (c.amount || 0);
    }, 0);
  }, [activeIndirectCosts]);

  // 5. Consolidated Core Metrics
  const totalSalesRevenue = totalStandardSalesRevenue + totalWhatsAppDailyRevenue;
  const totalCOGS = totalStandardCOGS + totalWhatsAppDailyCOGS;
  const totalUnitsSold = totalStandardUnitsSold + totalWhatsAppUnitsSold;

  // Operational Ad Spend for Sales Analysis (Derived strictly from WhatsApp live daily ad spend)
  const totalAdSpend = totalWhatsAppAdSpend;

  // 6. Inventory Overview Stats & Total Product Valuation
  const totalCatalogProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryCostValue = products.reduce((acc, p) => acc + (p.stock || 0) * (p.costPrice || 0), 0);
  const totalInventorySaleValue = products.reduce((acc, p) => acc + (p.stock || 0) * (p.salePrice || 0), 0);

  // Exact Gross and Net Profit calculations
  // 1. Ganancia Bruta por Prendas Vendidas (Margen directo: Ventas menos costo de confección de las prendas vendidas)
  const totalProductGrossProfit = totalSalesRevenue - totalCOGS;
  const grossProfitMargin = totalSalesRevenue > 0 ? (totalProductGrossProfit / totalSalesRevenue) * 100 : 0;

  // 2. Ganancia Neta Real (Bolsillo: Ventas menos costo de prendas vendidas, menos publicidad, menos gastos fijos)
  const totalNetProfitSold = totalSalesRevenue - totalCOGS - totalAdSpend - totalIndirectCosts;
  const profitMarginSold = totalSalesRevenue > 0 ? (totalNetProfitSold / totalSalesRevenue) * 100 : 0;

  // 3. Proyección al liquidar todo el inventario restante
  const totalProjectedSalesRevenue = totalSalesRevenue + totalInventorySaleValue;
  const totalAllInventoryCost = totalCOGS + totalInventoryCostValue;
  const totalNetProfitAllInventory = totalProjectedSalesRevenue - totalAllInventoryCost - totalAdSpend - totalIndirectCosts;
  const profitMarginAllInventory = totalProjectedSalesRevenue > 0 ? (totalNetProfitAllInventory / totalProjectedSalesRevenue) * 100 : 0;

  // Aliases for compatibility
  const totalGrossProfit = totalProductGrossProfit;
  const totalContributionMargin = totalSalesRevenue - totalCOGS - totalAdSpend;
  const totalNetProfit = totalNetProfitSold;
  const roas = totalAdSpend > 0 ? totalSalesRevenue / totalAdSpend : 0;
  const profitMargin = profitMarginSold;

  // Build monthly dataset
  const monthlyData = months.map((m) => {
    // Meta spend
    const monthExpenses = metaExpenses.filter((e) => e.monthKey === m.key);
    const metaSpend = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

    // WhatsApp daily spend
    const waRecordsForMonth = dailyRecords.filter((r) => r.date.startsWith(m.key));
    const waSpend = waRecordsForMonth.reduce((acc, r) => acc + (r.dailySpend || 0), 0);

    const monthAdSpend = waSpend;

    // Indirect costs for month
    const monthIndirect = activeIndirectCosts.reduce((acc, c) => {
      if (c.monthKey && c.monthKey === m.key) return acc + c.amount;
      if (!c.monthKey || c.monthKey === 'all' || c.periodicity === 'Mensual') {
        return acc + (c.periodicity === 'Anual' ? c.amount / 12 : c.amount);
      }
      return acc;
    }, 0);

    // Standard Sales
    const monthSales = sales.filter((s) => s.status !== 'Cancelada' && s.date.startsWith(m.key));
    const stdRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
    const stdCogs = monthSales.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + (item.costPrice || 0) * (item.quantity || 1), 0);
    }, 0);

    // WhatsApp Sales with exact resolution
    const resolvedMonthWa = waRecordsForMonth.map((r) => resolveRecordPriceAndCost(r, products, pricingRecords));
    const waRevenue = resolvedMonthWa.reduce((acc, item) => acc + item.revenue, 0);
    const waCogs = resolvedMonthWa.reduce((acc, item) => acc + item.cogs, 0);

    const monthRevenue = stdRevenue + waRevenue;
    const monthCogs = stdCogs + waCogs;
    
    // Break-even revenue needed = Ad Spend + COGS + Indirect Costs
    const breakEvenRevenue = monthAdSpend + monthCogs + monthIndirect;
    const netProfit = monthRevenue - breakEvenRevenue;
    const monthRoas = monthAdSpend > 0 ? monthRevenue / monthAdSpend : 0;

    return {
      monthKey: m.key,
      monthName: m.name,
      adSpend: Number(monthAdSpend.toFixed(2)),
      salesRevenue: Number(monthRevenue.toFixed(2)),
      cogs: Number(monthCogs.toFixed(2)),
      indirectCosts: Number(monthIndirect.toFixed(2)),
      breakEvenRevenue: Number(breakEvenRevenue.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      roas: Number(monthRoas.toFixed(2)),
    };
  });

  // 8. Break-Even Metrics
  const totalBreakEvenRevenue = totalAdSpend + totalCOGS + totalIndirectCosts;
  const breakEvenProgressPercent =
    totalBreakEvenRevenue > 0
      ? Math.min(300, Math.round((totalSalesRevenue / totalBreakEvenRevenue) * 100))
      : 100;

  const avgSalePrice =
    totalUnitsSold > 0
      ? totalSalesRevenue / totalUnitsSold
      : products.length > 0
      ? products.reduce((acc, p) => acc + p.salePrice, 0) / products.length
      : 99.0;

  const avgCostPrice =
    totalUnitsSold > 0
      ? totalCOGS / totalUnitsSold
      : products.length > 0
      ? products.reduce((acc, p) => acc + p.costPrice, 0) / products.length
      : 35.0;

  // 9. Product Sales Distribution Map (Strictly from WhatsApp Sales Products)
  const productSalesMap: { [productName: string]: { revenue: number; qty: number } } = {};

  resolvedDailyMetrics.forEach((item) => {
    const name = item.record.defaultProduct || 'Combo WhatsApp';
    if (!productSalesMap[name]) {
      productSalesMap[name] = { revenue: 0, qty: 0 };
    }
    productSalesMap[name].revenue += item.revenue;
    productSalesMap[name].qty += item.record.salesCount || 0;
  });

  const productData = Object.entries(productSalesMap)
    .map(([name, data]) => ({
      name,
      value: Number(data.revenue.toFixed(2)),
      qty: data.qty,
    }))
    .filter((d) => d.value > 0 || d.qty > 0)
    .sort((a, b) => b.value - a.value);

  // 10. Detailed Product Breakdown (Strictly from WhatsApp Sales Products)
  const detailedProductMetrics = useMemo(() => {
    const map = new Map<string, {
      name: string;
      unitsSold: number;
      revenue: number;
      cogs: number;
      adSpend: number;
      channels: Set<string>;
    }>();

    // From WhatsApp Daily Records
    resolvedDailyMetrics.forEach((item) => {
      const pName = (item.record.defaultProduct || 'Combo WhatsApp').trim();
      const entry = map.get(pName) || {
        name: pName,
        unitsSold: 0,
        revenue: 0,
        cogs: 0,
        adSpend: 0,
        channels: new Set<string>(['WhatsApp & Ads']),
      };
      entry.unitsSold += item.record.salesCount || 0;
      entry.revenue += item.revenue;
      entry.cogs += item.cogs;
      entry.adSpend += item.record.dailySpend || 0;
      map.set(pName, entry);
    });

    return Array.from(map.values()).map((p) => {
      const grossMargin = p.revenue - p.cogs;
      const contributionMargin = grossMargin - p.adSpend;
      const cpa = p.unitsSold > 0 && p.adSpend > 0 ? p.adSpend / p.unitsSold : 0;
      const roas = p.adSpend > 0 ? p.revenue / p.adSpend : 0;
      const avgPrice = p.unitsSold > 0 ? p.revenue / p.unitsSold : 0;
      const avgCost = p.unitsSold > 0 ? p.cogs / p.unitsSold : 0;
      return {
        ...p,
        grossMargin,
        contributionMargin,
        cpa,
        roas,
        avgPrice,
        avgCost,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [resolvedDailyMetrics]);

  const COLORS = ['#2563eb', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6'];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Filter Bar: Fecha (Mes) y Producto */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Fecha / Mes Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1 lg:pb-0">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pr-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Fecha:</span>
            </span>
            <button
              onClick={() => setSelectedMonth('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Todos los Meses
            </button>
            {months.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMonth(m.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedMonth === m.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Producto Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              <span>Producto:</span>
            </span>

            <div className="relative inline-block">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer pr-8"
              >
                <option value="all">📦 Todos los Productos ({availableProducts.length})</option>
                {availableProducts.map((p, idx) => (
                  <option key={idx} value={p.name}>
                    {p.name} ({p.unitsSold} und — S/ {p.salePrice.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct !== 'all' && (
              <button
                onClick={() => setSelectedProduct('all')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer transition-colors font-medium"
              >
                ✕ Ver Todos
              </button>
            )}
          </div>
        </div>

        {selectedProductInfo && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-600 flex-wrap">
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {selectedProductInfo.name}
            </span>
            <span>•</span>
            <span>Precio: <strong className="text-slate-900 font-mono">S/ {selectedProductInfo.salePrice.toFixed(2)}</strong></span>
            <span>•</span>
            <span>Costo: <strong className="text-slate-900 font-mono">S/ {selectedProductInfo.costPrice.toFixed(2)}</strong></span>
            <span>•</span>
            <span>Vendidos: <strong className="text-emerald-600 font-mono">{selectedProductInfo.unitsSold} und</strong></span>
            <span>•</span>
            <span>Ads: <strong className="text-blue-600 font-mono">S/ {selectedProductInfo.adSpend.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      {/* KPI Cards Header & Movable Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Métricas Clave del Negocio
          </h3>
          <span className="text-[11px] text-slate-400 font-normal hidden md:inline">
            (Arrastra los cuadritos o usa las flechas para organizarlos libremente)
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_AVAILABLE_CARD_DEFS.some((def) => !cardOrder.includes(def.id)) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddCardMenu(!showAddCardMenu)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Añadir tarjeta</span>
              </button>

              {showAddCardMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 space-y-0.5 animate-in fade-in-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Tarjetas disponibles
                  </p>
                  {ALL_AVAILABLE_CARD_DEFS.filter((def) => !cardOrder.includes(def.id)).map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleAddCard(card.id)}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center justify-between font-medium cursor-pointer"
                    >
                      <span>{card.title}</span>
                      <Plus className="w-3 h-3 text-emerald-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleResetCardOrder}
            className="text-[11px] text-slate-500 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer w-fit shadow-2xs font-medium"
            title="Restablecer orden inicial de las tarjetas"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer orden</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Independently Movable / Reorderable with Drag & Drop) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${
        cardOrder.length >= 7 ? 'xl:grid-cols-4 2xl:grid-cols-7' : cardOrder.length === 6 ? 'xl:grid-cols-3 2xl:grid-cols-6' : 'xl:grid-cols-4 2xl:grid-cols-5'
      } gap-4`}>
        {cardOrder.map((cardId, index) => {
          const isFirst = index === 0;
          const isLast = index === cardOrder.length - 1;
          const isDragged = draggedCardId === cardId;
          const isDragOver = dragOverCardId === cardId;

          const renderCardContent = () => {
            switch (cardId) {
              case 'total_sales':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ventas Totales</p>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-slate-900 mt-1 font-mono tracking-tight">
                            S/ {totalSalesRevenue.toFixed(2)}
                          </h3>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{totalUnitsSold} unidades vendidas</span>
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('total_sales', e)}
                        className="w-full text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1">💡 <span>Ver detalle</span></span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expandedCardDetails['total_sales'] ? 'rotate-180 text-slate-600' : ''}`} />
                      </button>
                      {expandedCardDetails['total_sales'] && (
                        <div className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                          <p>• WhatsApp: <strong className="font-mono text-slate-800">S/ {totalWhatsAppDailyRevenue.toFixed(2)}</strong> ({totalWhatsAppUnitsSold} und.)</p>
                          {totalStandardSalesRevenue > 0 && (
                            <p>• Tienda estándar: <strong className="font-mono text-slate-800">S/ {totalStandardSalesRevenue.toFixed(2)}</strong> ({totalStandardUnitsSold} und.)</p>
                          )}
                          <p className="text-slate-500 pt-0.5">Precio prom: S/ {avgSalePrice.toFixed(2)} / und</p>
                        </div>
                      )}
                    </div>
                  </>
                );

              case 'cogs':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Costo Prendas (COGS)</p>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-slate-800 mt-1 font-mono tracking-tight">
                            S/ {totalCOGS.toFixed(2)}
                          </h3>
                        </div>
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                        Costo Unit. Prom: <strong className="text-slate-800 font-mono">S/ {avgCostPrice.toFixed(2)}</strong>
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('cogs', e)}
                        className="w-full text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1">💡 <span>Ver fórmula</span></span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expandedCardDetails['cogs'] ? 'rotate-180 text-slate-600' : ''}`} />
                      </button>
                      {expandedCardDetails['cogs'] && (
                        <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Costo de adquisición/confección de las {totalUnitsSold} prendas vendidas.
                        </p>
                      )}
                    </div>
                  </>
                );

              case 'net_profit_sold':
              case 'gross_profit':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Ganancia Bruta (Prendas)</p>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Directo
                            </span>
                          </div>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className={`font-black mt-1 font-mono tracking-tight ${
                            totalProductGrossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            S/ {totalProductGrossProfit.toFixed(2)}
                          </h3>
                        </div>
                        <div className={`p-2 rounded-xl border shrink-0 ${
                          totalProductGrossProfit >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          <Coins className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium mt-1.5">
                        Margen Producto: <strong className="font-mono text-emerald-800">{grossProfitMargin.toFixed(1)}%</strong> ({totalUnitsSold} prendas vendidas)
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('net_profit_sold', e)}
                        className="w-full text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1">🏷️ <span>¿Qué significa esta ganancia?</span></span>
                        <ChevronDown className={`w-3 h-3 text-emerald-600 transition-transform duration-200 ${expandedCardDetails['net_profit_sold'] ? 'rotate-180 text-emerald-800' : ''}`} />
                      </button>
                      {expandedCardDetails['net_profit_sold'] && (
                        <div className="mt-1.5 text-[10px] text-slate-700 leading-tight bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 space-y-1 font-mono">
                          <div className="flex justify-between">
                            <span>(+) Ventas Totales ({totalUnitsSold} prendas):</span>
                            <span className="font-bold text-slate-900">S/ {totalSalesRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>(-) Costo de Confección/Compra:</span>
                            <span className="font-semibold">-S/ {totalCOGS.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-emerald-200 pt-1 mt-1 flex justify-between font-bold text-emerald-800">
                            <span>(=) Ganancia Bruta en Prendas:</span>
                            <span>S/ {totalProductGrossProfit.toFixed(2)}</span>
                          </div>
                          <p className="text-[9px] text-emerald-800 font-sans pt-1 leading-normal">
                            💡 <strong>Ganancia directa limpia:</strong> Dinero generado exclusivamente por las prendas vendidas antes de descontar publicidad y alquiler/fijos.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );

              case 'net_profit_inventory':
              case 'net_profit':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${
                              totalNetProfitSold >= 0 ? 'text-teal-700' : 'text-rose-700'
                            }`}>
                              Ganancia Neta Real
                            </p>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                              totalNetProfitSold >= 0 
                                ? 'bg-teal-100 text-teal-800 border-teal-200' 
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}>
                              Bolsillo Final
                            </span>
                          </div>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className={`font-black mt-1 font-mono tracking-tight ${
                            totalNetProfitSold >= 0 ? 'text-teal-600' : 'text-rose-600'
                          }`}>
                            S/ {totalNetProfitSold.toFixed(2)}
                          </h3>
                        </div>
                        <div className={`p-2 rounded-xl border shrink-0 ${
                          totalNetProfitSold >= 0 ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      
                      {totalNetProfitSold < 0 ? (
                        <p className="text-[10.5px] text-rose-600 font-semibold mt-1.5 leading-tight">
                          ⚠️ Faltan S/ {Math.abs(totalNetProfitSold).toFixed(2)} en ventas para cubrir fijos y publicidad del período.
                        </p>
                      ) : (
                        <p className="text-[11px] text-teal-700 font-medium mt-1.5">
                          Margen Neto Final: <strong className="font-mono text-teal-800">{profitMarginSold.toFixed(1)}%</strong>
                        </p>
                      )}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('net_profit_inventory', e)}
                        className="w-full text-[10px] text-teal-700 hover:text-teal-900 font-semibold flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1">💼 <span>Ver deducción completa</span></span>
                        <ChevronDown className={`w-3 h-3 text-teal-600 transition-transform duration-200 ${expandedCardDetails['net_profit_inventory'] ? 'rotate-180 text-teal-800' : ''}`} />
                      </button>
                      {expandedCardDetails['net_profit_inventory'] && (
                        <div className="mt-1.5 text-[10px] text-slate-700 leading-tight bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 space-y-1 font-mono">
                          <div className="flex justify-between text-slate-900">
                            <span>(+) Ventas Totales:</span>
                            <span className="font-bold">S/ {totalSalesRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>(-) Costo Prendas Vendidas:</span>
                            <span className="font-semibold">-S/ {totalCOGS.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-blue-600">
                            <span>(-) Gasto Publicidad (Meta Ads):</span>
                            <span>-S/ {totalAdSpend.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-600">
                            <span>(-) Costos Indirectos (Fijos):</span>
                            <span>-S/ {totalIndirectCosts.toFixed(2)}</span>
                          </div>
                          <div className={`border-t pt-1.5 mt-1 flex justify-between font-bold ${
                            totalNetProfitSold >= 0 ? 'border-teal-200 text-teal-800' : 'border-rose-200 text-rose-700'
                          }`}>
                            <span>(=) Ganancia Neta Real (Bolsillo):</span>
                            <span>S/ {totalNetProfitSold.toFixed(2)}</span>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-slate-200/80 font-sans">
                            <p className="text-[9.5px] text-slate-600 leading-normal">
                              📦 <strong>Stock en Taller:</strong> Tienes {totalStockUnits} prendas valorizadas en <strong>S/ {totalInventorySaleValue.toFixed(2)}</strong>. Al venderlas generarás <strong>+S/ {totalNetProfitAllInventory.toFixed(2)}</strong> de ganancia neta proyectada.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );

              case 'ad_spend':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gasto Publicidad</p>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-blue-600 mt-1 font-mono tracking-tight">
                            S/ {totalAdSpend.toFixed(2)}
                          </h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                          <Megaphone className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                        CPA Promedio: <strong className="text-blue-700 font-mono">S/ {totalUnitsSold > 0 ? (totalAdSpend / totalUnitsSold).toFixed(2) : '0.00'}</strong>
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('ad_spend', e)}
                        className="w-full text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1">💡 <span>Ver origen</span></span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expandedCardDetails['ad_spend'] ? 'rotate-180 text-slate-600' : ''}`} />
                      </button>
                      {expandedCardDetails['ad_spend'] && (
                        <div className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                          <p>• Inversión diaria WhatsApp: <strong className="font-mono text-slate-800">S/ {totalWhatsAppAdSpend.toFixed(2)}</strong></p>
                          {totalMetaFacturado > 0 && (
                            <p>• Facturas Meta Ads: <strong className="font-mono text-slate-800">S/ {totalMetaFacturado.toFixed(2)}</strong></p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                );

              case 'indirect_costs':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Costos Indirectos</p>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-indigo-700 mt-1 font-mono tracking-tight">
                            S/ {totalIndirectCosts.toFixed(2)}
                          </h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                        Fijos: <strong className="text-slate-800 font-mono">{activeIndirectCosts.length} rubros</strong> (Taller/Serv)
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('indirect_costs', e)}
                        className="w-full text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1">🏢 <span>Ver detalles fijos</span></span>
                        <ChevronDown className={`w-3 h-3 text-indigo-600 transition-transform duration-200 ${expandedCardDetails['indirect_costs'] ? 'rotate-180 text-indigo-800' : ''}`} />
                      </button>
                      {expandedCardDetails['indirect_costs'] && (
                        <div className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 space-y-1">
                          <p>Gastos operativos mensuales fijos (alquiler, taller, servicios) descontados de la ganancia.</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('indirect_costs');
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer mt-1"
                          >
                            <span>Administrar costos fijos</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );

              case 'roas':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ROAS Anuncios</p>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-amber-600 mt-1 font-mono tracking-tight">
                            {roas.toFixed(2)}x
                          </h3>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                        Retorno: <strong className="text-amber-700 font-mono">S/ {roas.toFixed(2)} x S/1</strong>
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('roas', e)}
                        className="w-full text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1">💡 <span>Ver nota</span></span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expandedCardDetails['roas'] ? 'rotate-180 text-slate-600' : ''}`} />
                      </button>
                      {expandedCardDetails['roas'] && (
                        <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Ventas Totales (S/ {totalSalesRevenue.toFixed(2)}) ÷ Gasto en Anuncios (S/ {totalAdSpend.toFixed(2)}).
                        </p>
                      )}
                    </div>
                  </>
                );

              case 'net_profit':
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ganancia Neta Real</p>
                          <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className={`font-black mt-1 font-mono tracking-tight ${
                            totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            S/ {totalNetProfit.toFixed(2)}
                          </h3>
                        </div>
                        <div className={`p-2 rounded-xl border shrink-0 ${
                          totalNetProfit >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                        Margen Neto: <strong className={`font-mono ${totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{profitMargin.toFixed(1)}%</strong>
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => toggleCardDetail('net_profit', e)}
                        className="w-full text-[10px] text-slate-500 hover:text-slate-700 font-semibold flex items-center justify-between cursor-pointer select-none py-0.5"
                      >
                        <span className="flex items-center gap-1 text-emerald-700">🧮 <span>Desglosar manualmente</span></span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${expandedCardDetails['net_profit'] ? 'rotate-180 text-slate-600' : ''}`} />
                      </button>
                      {expandedCardDetails['net_profit'] && (
                        <div className="mt-1.5 text-[10px] text-slate-700 leading-tight bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5 font-mono">
                          <div className="flex justify-between">
                            <span>(+) Ventas:</span>
                            <span className="font-bold text-slate-900">S/ {totalSalesRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>(-) COGS:</span>
                            <span>-S/ {totalCOGS.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-blue-600">
                            <span>(-) Publicidad:</span>
                            <span>-S/ {totalAdSpend.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-600">
                            <span>(-) Fijos:</span>
                            <span>-S/ {totalIndirectCosts.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-slate-300 pt-0.5 mt-0.5 flex justify-between font-bold">
                            <span className={totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>(=) Ganancia Neta:</span>
                            <span className={totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>S/ {totalNetProfit.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );

              default:
                return null;
            }
          };

          const getCardStyle = () => {
            switch (cardId) {
              case 'total_sales':
                return {
                  border: 'border-emerald-300/90 hover:border-emerald-500 bg-linear-to-b from-emerald-50/20 via-white to-white',
                  indicator: 'bg-emerald-500',
                  divider: 'border-emerald-100',
                };
              case 'cogs':
                return {
                  border: 'border-slate-300 hover:border-slate-400 bg-linear-to-b from-slate-50/40 via-white to-white',
                  indicator: 'bg-slate-500',
                  divider: 'border-slate-100',
                };
              case 'net_profit_sold':
              case 'gross_profit':
                return totalNetProfitSold >= 0
                  ? {
                      border: 'border-emerald-400 hover:border-emerald-600 bg-linear-to-b from-emerald-50/30 via-white to-white shadow-emerald-500/5',
                      indicator: 'bg-emerald-500',
                      divider: 'border-emerald-100',
                    }
                  : {
                      border: 'border-rose-300/90 hover:border-rose-500 bg-linear-to-b from-rose-50/25 via-white to-white shadow-rose-500/5',
                      indicator: 'bg-rose-500',
                      divider: 'border-rose-100',
                    };
              case 'ad_spend':
                return {
                  border: 'border-blue-300/90 hover:border-blue-500 bg-linear-to-b from-blue-50/25 via-white to-white',
                  indicator: 'bg-blue-500',
                  divider: 'border-blue-100',
                };
              case 'indirect_costs':
                return {
                  border: 'border-indigo-300/90 hover:border-indigo-500 bg-linear-to-b from-indigo-50/25 via-white to-white',
                  indicator: 'bg-indigo-500',
                  divider: 'border-indigo-100',
                };
              case 'roas':
                return {
                  border: 'border-amber-300/90 hover:border-amber-500 bg-linear-to-b from-amber-50/25 via-white to-white',
                  indicator: 'bg-amber-500',
                  divider: 'border-amber-100',
                };
              case 'net_profit_inventory':
              case 'net_profit':
                return totalNetProfitAllInventory >= 0
                  ? {
                      border: 'border-teal-400/90 hover:border-teal-600 bg-linear-to-b from-teal-50/30 via-white to-white shadow-teal-500/5',
                      indicator: 'bg-teal-500',
                      divider: 'border-teal-100',
                    }
                  : {
                      border: 'border-rose-300/90 hover:border-rose-500 bg-linear-to-b from-rose-50/25 via-white to-white shadow-rose-500/5',
                      indicator: 'bg-rose-500',
                      divider: 'border-rose-100',
                    };
              default:
                return {
                  border: 'border-slate-200 hover:border-slate-300 bg-white',
                  indicator: 'bg-slate-400',
                  divider: 'border-slate-100',
                };
            }
          };

          const cardTheme = getCardStyle();

          return (
            <div
              key={cardId}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', cardId);
                setDraggedCardId(cardId);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOverCardId(cardId);
              }}
              onDragLeave={() => {
                if (dragOverCardId === cardId) setDragOverCardId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId = (e.dataTransfer.getData('text/plain') as DashboardCardId) || draggedCardId;
                if (sourceId) {
                  moveCard(sourceId, cardId);
                }
                setDraggedCardId(null);
                setDragOverCardId(null);
              }}
              onDragEnd={() => {
                setDraggedCardId(null);
                setDragOverCardId(null);
              }}
              className={`border-2 rounded-2xl p-3.5 sm:p-4 shadow-2xs relative overflow-hidden group transition-all flex flex-col justify-between ${
                isDragged ? 'opacity-40 scale-[0.98] border-dashed border-blue-400' : ''
              } ${
                isDragOver ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/20' : `${cardTheme.border} hover:shadow-sm`
              }`}
            >
              {/* Card Reordering Bar / Move Controls */}
              <div className={`flex items-center justify-between pb-2 mb-1 border-b ${cardTheme.divider}`}>
                <div
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing select-none"
                  title="Arrastra para mover este cuadrito a otra posición"
                >
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Mover</span>
                </div>

                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => shiftCard(cardId, 'left')}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                      isFirst ? 'opacity-20 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                    }`}
                    title="Mover a la izquierda"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => shiftCard(cardId, 'right')}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                      isLast ? 'opacity-20 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                    }`}
                    title="Mover a la derecha"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveCard(cardId, e)}
                    className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                    title="Borrar / Ocultar esta tarjeta"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {renderCardContent()}
            </div>
          );
        })}
      </div>



      {/* Main Financial Evolution & Product Sales Distribution (Unique Single Instance) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Financial Progress */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Evolución Financiera Mensual</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inversión publicitaria (azul), Ventas totales (verde) y Ganancia neta real (amarillo).
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold self-start sm:self-auto border border-slate-200">
              {months.length} Meses Registrados
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="monthName" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="adSpend" name="Inversión Publicidad (S/)" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="salesRevenue" name="Ventas Totales (S/)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="netProfit" name="Ganancia Neta (S/)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Sales Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ventas por Producto</h3>
            <p className="text-xs text-slate-500 mb-3">
              Distribución de ingresos según cada producto o combo.
            </p>

            <div className="h-52 w-full flex items-center justify-center">
              {productData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {productData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '10px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Ventas']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">No hay ventas registradas aún</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-2">
            {productData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-600 truncate">{item.name} ({item.qty} und)</span>
                </div>
                <span className="font-bold text-slate-900 font-mono">S/ {item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ANÁLISIS PRO: GRÁFICA PUNTO DE EQUILIBRIO (SINGLE CLEAN INSTANCE) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Análisis Pro: Gráfica de Punto de Equilibrio</h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Incluye Costos Indirectos
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ventas Reales (Área Verde) vs Umbral Mínimo Requerido = Costo Prendas + Publicidad + Costos Indirectos (Línea Roja)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {totalSalesRevenue >= totalBreakEvenRevenue ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Punto de Equilibrio Superado ({breakEvenProgressPercent}%)
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Cobertura al {breakEvenProgressPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Cost breakdown summary chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] font-medium">📦 Costo Prendas (COGS):</span>
            <p className="font-bold text-slate-800 font-mono text-sm">S/ {totalCOGS.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] font-medium">📢 Inversión Anuncios:</span>
            <p className="font-bold text-blue-600 font-mono text-sm">S/ {totalAdSpend.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] font-medium">🏢 Costos Indirectos:</span>
            <p className="font-bold text-indigo-600 font-mono text-sm">S/ {totalIndirectCosts.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] font-medium">🎯 Punto de Equilibrio Total:</span>
            <p className="font-bold text-rose-600 font-mono text-sm">S/ {totalBreakEvenRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="monthName" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any, name: any) => [`S/ ${Number(value).toFixed(2)}`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              
              <Area type="monotone" dataKey="salesRevenue" name="Ventas Reales (S/)" fill="#10b98115" stroke="#10b981" strokeWidth={3} />
              <Line
                type="monotone"
                dataKey="breakEvenRevenue"
                name="Punto de Equilibrio Mínimo (COGS + Ads + Indirectos) (S/)"
                stroke="#ef4444"
                strokeWidth={2.5}
                strokeDasharray="6 6"
                dot={{ r: 4, fill: '#ef4444' }}
              />
              <Line
                type="monotone"
                dataKey="netProfit"
                name="Ganancia Neta Real (S/)"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ANÁLISIS PRO: TABLA DETALLADA DE RENTABILIDAD POR PRODUCTO / COMBO */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Rendimiento y Rentabilidad por Producto / Combo</h3>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  {detailedProductMetrics.length} Productos con Actividad
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Desglose unitario real: Precio de venta, COGS (costo prenda), gasto en anuncios atribuido, margen de contribución, CPA y ROAS.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600">
                <th className="py-3 px-3.5 rounded-l-lg">Producto / Combo</th>
                <th className="py-3 px-3 text-center">Canal</th>
                <th className="py-3 px-3 text-center">Unidades</th>
                <th className="py-3 px-3 text-right">P. Prom. Venta</th>
                <th className="py-3 px-3 text-right">Costo Unit. (COGS)</th>
                <th className="py-3 px-3 text-right">Ventas Totales</th>
                <th className="py-3 px-3 text-right">Costo Prendas</th>
                <th className="py-3 px-3 text-right">Gasto Ads</th>
                <th className="py-3 px-3 text-right">CPA</th>
                <th className="py-3 px-3 text-right">Margen Bruto</th>
                <th className="py-3 px-3 text-right">Margen Contrib.</th>
                <th className="py-3 px-3.5 text-right rounded-r-lg">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailedProductMetrics.length > 0 ? (
                detailedProductMetrics.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {Array.from(p.channels).map((ch, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              ch === 'WhatsApp & Ads'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                      {p.unitsSold}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      S/ {p.avgPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      S/ {p.avgCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      S/ {p.revenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      S/ {p.cogs.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-600 font-semibold">
                      {p.adSpend > 0 ? `S/ ${p.adSpend.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {p.cpa > 0 ? `S/ ${p.cpa.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600">
                      S/ {p.grossMargin.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={p.contributionMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        S/ {p.contributionMargin.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold">
                      {p.roas > 0 ? (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] ${
                            p.roas >= 3
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.roas >= 1.5
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.roas.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No hay ventas registradas para el período o filtro seleccionado
                  </td>
                </tr>
              )}
            </tbody>
            {detailedProductMetrics.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900 text-xs">
                  <td className="py-3 px-3.5">Totales Consolidados</td>
                  <td className="py-3 px-3 text-center">-</td>
                  <td className="py-3 px-3 text-center font-mono">{totalUnitsSold}</td>
                  <td className="py-3 px-3 text-right font-mono">S/ {avgSalePrice.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">S/ {avgCostPrice.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">S/ {totalSalesRevenue.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">S/ {totalCOGS.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-blue-600">S/ {totalAdSpend.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    {totalUnitsSold > 0 && totalAdSpend > 0 ? `S/ ${(totalAdSpend / totalUnitsSold).toFixed(2)}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600">S/ {totalGrossProfit.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700">S/ {totalContributionMargin.toFixed(2)}</td>
                  <td className="py-3 px-3.5 text-right font-mono text-blue-700">{roas > 0 ? `${roas.toFixed(2)}x` : '-'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};
