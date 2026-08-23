import React from 'react';
import { Sale, MetaAdExpense, Product, TabType, DailySaleRecord, IndirectCost } from '../types';
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
  ArrowRight
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  dailyRecords = [],
  metaExpenses,
  indirectCosts = [],
  products,
  setActiveTab,
}) => {
  // 1. Standard Sales Calculations
  const totalStandardSalesRevenue = sales
    .filter((s) => s.status !== 'Cancelada')
    .reduce((acc, s) => acc + s.total, 0);

  const totalStandardCOGS = sales
    .filter((s) => s.status !== 'Cancelada')
    .reduce((acc, s) => {
      const itemsCost = s.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
      return acc + itemsCost;
    }, 0);

  const totalStandardUnitsSold = sales
    .filter((s) => s.status !== 'Cancelada')
    .reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);

  // 2. WhatsApp Daily Sales Calculations
  const totalWhatsAppDailyRevenue = dailyRecords.reduce((acc, rec) => {
    const p = products.find((prod) => prod.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase());
    const unitPrice = p ? p.salePrice : 0;
    return acc + rec.salesCount * unitPrice;
  }, 0);

  const totalWhatsAppDailyCOGS = dailyRecords.reduce((acc, rec) => {
    const p = products.find((prod) => prod.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase());
    const unitCost = p ? p.costPrice : 0;
    return acc + rec.salesCount * unitCost;
  }, 0);

  const totalWhatsAppAdSpend = dailyRecords.reduce((acc, r) => acc + r.dailySpend, 0);
  const totalWhatsAppUnitsSold = dailyRecords.reduce((acc, r) => acc + r.salesCount, 0);

  // 3. Meta Ads Calculations
  const totalMetaFacturado = metaExpenses.reduce((acc, e) => acc + e.amount, 0);

  // 4. Indirect & Fixed Costs Calculations
  const activeIndirectCosts = indirectCosts.filter((c) => c.isActive !== false);
  const totalIndirectCosts = activeIndirectCosts.reduce((sum, c) => {
    if (c.periodicity === 'Anual') return sum + c.amount / 12;
    return sum + c.amount;
  }, 0);

  // 5. Consolidated Core Metrics
  const totalSalesRevenue = totalStandardSalesRevenue + totalWhatsAppDailyRevenue;
  const totalAdSpend = totalMetaFacturado + totalWhatsAppAdSpend;
  const totalCOGS = totalStandardCOGS + totalWhatsAppDailyCOGS;
  const totalNetProfit = totalSalesRevenue - totalCOGS - totalAdSpend - totalIndirectCosts;
  const totalUnitsSold = totalStandardUnitsSold + totalWhatsAppUnitsSold;
  const roas = totalAdSpend > 0 ? totalSalesRevenue / totalAdSpend : 0;
  const profitMargin = totalSalesRevenue > 0 ? (totalNetProfit / totalSalesRevenue) * 100 : 0;

  // 6. Inventory Overview Stats & Total Product Valuation
  const totalCatalogProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryCostValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalInventorySaleValue = products.reduce((acc, p) => acc + p.stock * p.salePrice, 0);

  // 7. DYNAMIC MONTH DETECTION (100% Real-time and connected to all dates)
  const dynamicMonthKeysSet = new Set<string>();

  // Default base months for display if no user data yet
  ['2026-03', '2026-04', '2026-05', '2026-06'].forEach((k) => dynamicMonthKeysSet.add(k));

  metaExpenses.forEach((e) => {
    if (e.monthKey) dynamicMonthKeysSet.add(e.monthKey);
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

  // Build monthly dataset including break-even analysis per month
  const monthlyData = months.map((m) => {
    // Meta spend
    const monthExpenses = metaExpenses.filter((e) => e.monthKey === m.key);
    const metaSpend = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

    // WhatsApp daily spend for month
    const waSpend = dailyRecords
      .filter((r) => r.date.startsWith(m.key))
      .reduce((acc, r) => acc + r.dailySpend, 0);

    const monthAdSpend = metaSpend + waSpend;

    // Indirect costs for this month
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
      return acc + s.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    }, 0);

    // WhatsApp Sales
    const monthWaRecords = dailyRecords.filter((r) => r.date.startsWith(m.key));
    const waRevenue = monthWaRecords.reduce((acc, rec) => {
      const p = products.find((prod) => prod.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase());
      return acc + rec.salesCount * (p ? p.salePrice : 0);
    }, 0);
    const waCogs = monthWaRecords.reduce((acc, rec) => {
      const p = products.find((prod) => prod.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase());
      return acc + rec.salesCount * (p ? p.costPrice : 0);
    }, 0);

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

  // 8. BREAK-EVEN (PUNTO DE EQUILIBRIO) OVERALL CALCULATIONS
  const totalBreakEvenRevenue = totalAdSpend + totalCOGS + totalIndirectCosts;
  const breakEvenProgressPercent =
    totalBreakEvenRevenue > 0
      ? Math.min(200, Math.round((totalSalesRevenue / totalBreakEvenRevenue) * 100))
      : 100;

  // Average unit economics for break-even target units
  const avgSalePrice =
    totalUnitsSold > 0
      ? totalSalesRevenue / totalUnitsSold
      : products.length > 0
      ? products.reduce((acc, p) => acc + p.salePrice, 0) / products.length
      : 80;

  const avgCostPrice =
    totalUnitsSold > 0
      ? totalCOGS / totalUnitsSold
      : products.length > 0
      ? products.reduce((acc, p) => acc + p.costPrice, 0) / products.length
      : 30;

  const avgContributionMargin = avgSalePrice - avgCostPrice;
  const targetBreakEvenUnits =
    avgContributionMargin > 0 && (totalAdSpend + totalIndirectCosts) > 0
      ? Math.ceil((totalAdSpend + totalIndirectCosts) / avgContributionMargin)
      : 0;

  // Top products dataset combining sales & dailyRecords
  const productSalesMap: { [productName: string]: { revenue: number; qty: number } } = {};

  // Map products from catalog
  products.forEach((p) => {
    productSalesMap[p.name] = { revenue: 0, qty: 0 };
  });

  // Standard sales items
  sales.forEach((s) => {
    if (s.status !== 'Cancelada') {
      s.items.forEach((item) => {
        if (!productSalesMap[item.productName]) {
          productSalesMap[item.productName] = { revenue: 0, qty: 0 };
        }
        productSalesMap[item.productName].revenue += item.unitPrice * item.quantity;
        productSalesMap[item.productName].qty += item.quantity;
      });
    }
  });

  // WhatsApp daily records
  dailyRecords.forEach((rec) => {
    const p = products.find((prod) => prod.name.trim().toLowerCase() === rec.defaultProduct.trim().toLowerCase());
    const unitPrice = p ? p.salePrice : 0;
    const name = p ? p.name : rec.defaultProduct;

    if (!productSalesMap[name]) {
      productSalesMap[name] = { revenue: 0, qty: 0 };
    }
    productSalesMap[name].revenue += rec.salesCount * unitPrice;
    productSalesMap[name].qty += rec.salesCount;
  });

  const productData = Object.entries(productSalesMap)
    .map(([name, data]) => ({
      name,
      value: data.revenue,
      qty: data.qty,
    }))
    .filter((d) => d.value > 0 || d.qty > 0);

  const COLORS = ['#2563eb', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-6 pb-12">
      
      {/* System Integration Live Status Banner */}
      <div className="bg-slate-900 text-white p-4.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Análisis Pro Integrado (100% En Vivo)</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Conectado En Tiempo Real
              </span>
            </div>
            <details className="group text-xs text-slate-300 cursor-pointer pt-0.5">
              <summary className="text-[11px] text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 list-none select-none cursor-pointer">
                <span>📌 Ver descripción del módulo</span>
                <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180 inline" />
              </summary>
              <p className="mt-1 text-xs text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                Consolida automáticamente ventas WhatsApp, stock en almacén, gasto de anuncios, costos indirectos fijos y cálculo exacto de Punto de Equilibrio.
              </p>
            </details>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('indirect_costs')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-medium"
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fijos: S/ {totalIndirectCosts.toFixed(2)}</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-medium"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ventas ({dailyRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-medium"
          >
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span>Stock: {totalStockUnits} und.</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Structured with Indirect Costs BEFORE Net Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* 1. Total Sales (Consolidated) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ventas Totales</p>
                <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-slate-900 mt-1 font-mono tracking-tight">S/ {totalSalesRevenue.toFixed(2)}</h3>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{totalUnitsSold} und. vendidas</span>
            </p>
          </div>
          <details className="group mt-2.5 pt-2 border-t border-slate-100 cursor-pointer">
            <summary className="text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between list-none select-none cursor-pointer">
              <span className="flex items-center gap-1">💡 <span>Ver nota</span></span>
              <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
              Suma monetaria total facturada por ventas realizadas en WhatsApp.
            </p>
          </details>
        </div>

        {/* 2. Total Product Inventory Value */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden group hover:border-indigo-300 transition-all hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Productos</p>
                <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-indigo-600 mt-1 font-mono tracking-tight">S/ {totalInventorySaleValue.toFixed(2)}</h3>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              Costo: <strong className="text-slate-800 font-mono">S/ {totalInventoryCostValue.toFixed(2)}</strong>
            </p>
          </div>
          <details className="group mt-2.5 pt-2 border-t border-slate-100 cursor-pointer">
            <summary className="text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between list-none select-none cursor-pointer">
              <span className="flex items-center gap-1">💡 <span>Ver nota</span></span>
              <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
              Dinero estimado a cobrar si vendes todo el stock actual ({totalStockUnits} prendas).
            </p>
          </details>
        </div>

        {/* 3. Total Ad Spend */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden group hover:border-blue-300 transition-all hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gasto Publicidad</p>
                <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-blue-600 mt-1 font-mono tracking-tight">S/ {totalAdSpend.toFixed(2)}</h3>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              Meta Ads: <strong className="text-slate-800 font-mono">S/ {totalMetaFacturado.toFixed(2)}</strong>
            </p>
          </div>
          <details className="group mt-2.5 pt-2 border-t border-slate-100 cursor-pointer">
            <summary className="text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between list-none select-none cursor-pointer">
              <span className="flex items-center gap-1">💡 <span>Ver nota</span></span>
              <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
              Inversión publicitaria acumulada en anuncios para conseguir ventas.
            </p>
          </details>
        </div>

        {/* 4. TOTAL COSTOS INDIRECTOS (PLACED BEFORE GANANCIA NETA & MARGEN NETO) */}
        <div className="bg-white border border-indigo-200/90 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden group hover:border-indigo-400 transition-all hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Costos Indirectos</p>
                <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-indigo-700 mt-1 font-mono tracking-tight">S/ {totalIndirectCosts.toFixed(2)}</h3>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              Fijos: <strong className="text-slate-800 font-mono">{activeIndirectCosts.length} rubros</strong> (Taller/Serv)
            </p>
          </div>
          <details className="group mt-2.5 pt-2 border-t border-slate-100 cursor-pointer">
            <summary className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-between list-none select-none cursor-pointer">
              <span className="flex items-center gap-1">🏢 <span>Ver detalles fijos</span></span>
              <ChevronDown className="w-3 h-3 text-indigo-600 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 space-y-1">
              <p>Gastos operativos fijos (alquiler, taller, software, servicios) descontados antes de la ganancia neta.</p>
              <button
                onClick={() => setActiveTab('indirect_costs')}
                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Administrar costos indirectos</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </details>
        </div>

        {/* 5. ROAS Consolidated */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ROAS Anuncios</p>
                <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className="font-black text-amber-600 mt-1 font-mono tracking-tight">{roas.toFixed(2)}x</h3>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              Retorno: <strong className="text-amber-700 font-mono">S/ {roas.toFixed(2)} x S/1</strong>
            </p>
          </div>
          <details className="group mt-2.5 pt-2 border-t border-slate-100 cursor-pointer">
            <summary className="text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between list-none select-none cursor-pointer">
              <span className="flex items-center gap-1">💡 <span>Ver nota</span></span>
              <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
              Multiplicador de anuncios. Indica cuántos soles vendes por cada S/1 invertido en Meta Ads.
            </p>
          </details>
        </div>

        {/* 6. Net Profit & Margin (Ventas - COGS - Ads - Costos Indirectos) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ganancia Neta</p>
                <h3 style={{ fontSize: '23px', lineHeight: '1.2' }} className={`font-black mt-1 font-mono tracking-tight ${totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  S/ {totalNetProfit.toFixed(2)}
                </h3>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              Margen Neto: <strong className="text-slate-800 font-mono">{profitMargin.toFixed(1)}%</strong>
            </p>
          </div>
          <details className="group mt-2.5 pt-2 border-t border-slate-100 cursor-pointer">
            <summary className="text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-between list-none select-none cursor-pointer">
              <span className="flex items-center gap-1">💡 <span>Ver fórmula</span></span>
              <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
              Ganancia líquida real = Ventas (S/ {totalSalesRevenue.toFixed(2)}) - Costo Prendas (S/ {totalCOGS.toFixed(2)}) - Publicidad (S/ {totalAdSpend.toFixed(2)}) - Costos Indirectos (S/ {totalIndirectCosts.toFixed(2)}).
            </p>
          </details>
        </div>

      </div>

      {/* Inventory & Stock Health Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                Inventario D'RAYO
              </span>
              <span className="text-xs text-slate-400">• {totalCatalogProducts} Modelos en Catálogo</span>
            </div>
            <h3 className="text-lg font-bold text-white">Stock Total Disponible: {totalStockUnits} Unidades</h3>
            <p className="text-xs text-slate-300">
              Valor de Venta en Almacén: <strong className="text-emerald-400 font-mono">S/ {totalInventorySaleValue.toFixed(2)}</strong> | Costo de Producción: <strong className="text-slate-200 font-mono">S/ {totalInventoryCostValue.toFixed(2)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('inventory')}
              className="bg-blue-600 hover:bg-blue-500 active:scale-98 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Gestionar Inventario
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className="bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              Calculadora de Márgenes
            </button>
          </div>
        </div>
      </div>

      {/* Historical Monthly Overview & Product Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Financial Progress */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Evolución Financiera Mensual</h3>
              <details className="group text-xs text-slate-500 cursor-pointer pt-0.5">
                <summary className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 list-none select-none cursor-pointer">
                  <span>📌 Ver explicación</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180 inline" />
                </summary>
                <p className="mt-1 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Comparativa de Inversión publicitaria, Ventas totales y Ganancia neta mes a mes.
                </p>
              </details>
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
            <details className="group text-xs text-slate-500 cursor-pointer pt-0.5 mb-3">
              <summary className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 list-none select-none cursor-pointer">
                <span>📌 Ver explicación</span>
                <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180 inline" />
              </summary>
              <p className="mt-1 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                Distribución de ingresos según cada prenda del catálogo D'RAYO.
              </p>
            </details>

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
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-600 truncate">{item.name} ({item.qty} und)</span>
                </div>
                <span className="font-bold text-slate-900 font-mono">S/ {item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ANÁLISIS PRO: GRÁFICA PUNTO DE EQUILIBRIO (INCORPORATING DIRECT + ADS + INDIRECT COSTS) */}
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

      {/* Inventory & Stock Health Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Estado e Inventario de Productos</h3>
            </div>
            <details className="group text-xs text-slate-300 cursor-pointer pt-0.5">
              <summary className="text-[11px] text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 list-none select-none cursor-pointer">
                <span>📌 Ver explicación de esta sección</span>
                <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180 inline" />
              </summary>
              <p className="mt-1 text-xs text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700 leading-relaxed">
                Muestra la salud de tu almacén en tiempo real. Cada vez que registras una venta en WhatsApp, el stock se descuenta automáticamente de aquí.
              </p>
            </details>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full md:w-auto bg-white/5 p-3 rounded-xl border border-white/10">
            <div>
              <div className="text-[11px] text-slate-400">Variedades</div>
              <div style={{ fontSize: '20px' }} className="font-black font-mono text-white">{totalCatalogProducts}</div>
            </div>
            <div className="border-l border-white/10 sm:border-x px-2">
              <div className="text-[11px] text-slate-400">Stock Físico</div>
              <div style={{ fontSize: '20px' }} className="font-black font-mono text-indigo-300">{totalStockUnits} und.</div>
            </div>
            <div className="border-l border-white/10 sm:border-r px-2">
              <div className="text-[11px] text-slate-400">Costo Invertido</div>
              <div style={{ fontSize: '20px' }} className="font-black font-mono text-slate-300">S/ {totalInventoryCostValue.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Valor Comercial</div>
              <div style={{ fontSize: '20px' }} className="font-black font-mono text-emerald-400">S/ {totalInventorySaleValue.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Chart (Live & Connected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Gasto Publicidad vs Ventas WhatsApp</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  En Vivo
                </span>
              </div>
              <details className="group text-xs text-slate-500 cursor-pointer pt-0.5">
                <summary className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 list-none select-none cursor-pointer">
                  <span>📌 Ver explicación</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180 inline" />
                </summary>
                <p className="mt-1 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Gráfico conectado a todas las fechas registradas. Muestra inversión en anuncios (azul), ventas cobradas (verde) y ganancia neta (línea amarilla).
                </p>
              </details>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0 font-mono">
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
            <details className="group text-xs text-slate-500 cursor-pointer pt-0.5 mb-3">
              <summary className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 list-none select-none cursor-pointer">
                <span>📌 Ver explicación</span>
                <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-200 group-open:rotate-180 inline" />
              </summary>
              <p className="mt-1 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                Distribución de ingresos según cada prenda del catálogo D'RAYO.
              </p>
            </details>

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
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-600 truncate">{item.name} ({item.qty} und)</span>
                </div>
                <span className="font-bold text-slate-900 font-mono">S/ {item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PUNTO DE EQUILIBRIO CHART ONLY */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gráfico de Punto de Equilibrio</h3>
              <p className="text-xs text-slate-500">Ventas Reales (Verde) vs Umbral Mínimo Requerido (Línea Roja)</p>
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
                name="Punto de Equilibrio Mínimo (S/)"
                stroke="#ef4444"
                strokeWidth={2.5}
                strokeDasharray="6 6"
                dot={{ r: 4, fill: '#ef4444' }}
              />
              <Line
                type="monotone"
                dataKey="netProfit"
                name="Ganancia Neta (S/)"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
