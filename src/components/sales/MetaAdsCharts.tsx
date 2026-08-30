import React, { useState } from 'react';
import { DailySaleRecord, Product, PricingCalculationRecord } from '../../types';
import { resolveRecordPriceAndCost } from '../../lib/adUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Award,
  Zap,
  Target,
  BarChart2,
  MapPin,
  PieChart as PieChartIcon,
  Compass,
  ArrowUpRight
} from 'lucide-react';

interface MetaAdsChartsProps {
  records: DailySaleRecord[];
  products: Product[];
  pricingRecords?: PricingCalculationRecord[];
}

const DEPARTMENT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b', // Slate
];

export const MetaAdsCharts: React.FC<MetaAdsChartsProps> = ({ records, products, pricingRecords = [] }) => {
  const [departmentSortBy, setDepartmentSortBy] = useState<'sales' | 'revenue' | 'cpa'>('sales');

  // Sort records chronologically
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // Group by date for timeline chart
  const dateMap = new Map<
    string,
    { date: string; displayDate: string; spend: number; sales: number; cpa: number; revenue: number }
  >();

  sortedRecords.forEach((r) => {
    const res = resolveRecordPriceAndCost(r, products, pricingRecords);
    const estRev = res.revenue;

    if (!dateMap.has(r.date)) {
      const parts = r.date.split('-');
      const dLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.date;
      dateMap.set(r.date, {
        date: r.date,
        displayDate: dLabel,
        spend: r.dailySpend,
        sales: r.salesCount,
        cpa: r.cpa,
        revenue: estRev,
      });
    } else {
      const existing = dateMap.get(r.date)!;
      existing.spend += r.dailySpend;
      existing.sales += r.salesCount;
      existing.revenue += estRev;
      existing.cpa = existing.sales > 0 ? existing.spend / existing.sales : 0;
    }
  });

  const timelineData = Array.from(dateMap.values()).slice(-14); // Last 14 days of data

  // Group by Product for performance ranking
  const productMap = new Map<
    string,
    { product: string; spend: number; sales: number; cpa: number; revenue: number; roas: number }
  >();

  records.forEach((r) => {
    const pName = r.defaultProduct || 'Venta WhatsApp';
    const res = resolveRecordPriceAndCost(r, products, pricingRecords);
    const estRev = res.revenue;

    if (!productMap.has(pName)) {
      productMap.set(pName, {
        product: pName,
        spend: r.dailySpend,
        sales: r.salesCount,
        cpa: 0,
        revenue: estRev,
        roas: 0,
      });
    } else {
      const ex = productMap.get(pName)!;
      ex.spend += r.dailySpend;
      ex.sales += r.salesCount;
      ex.revenue += estRev;
    }
  });

  const productData = Array.from(productMap.values())
    .map((item) => ({
      ...item,
      cpa: item.sales > 0 ? parseFloat((item.spend / item.sales).toFixed(2)) : 0,
      roas: item.spend > 0 ? parseFloat((item.revenue / item.spend).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.sales - a.sales);

  // Group by Department for Geographic Performance
  const departmentMap = new Map<
    string,
    { department: string; spend: number; sales: number; cpa: number; revenue: number; roas: number; percentage: number }
  >();

  let totalSalesSum = 0;
  let totalRevenueSum = 0;

  records.forEach((r) => {
    const depName = r.department && r.department.trim() ? r.department.trim() : 'Lima';
    const res = resolveRecordPriceAndCost(r, products, pricingRecords);
    const estRev = res.revenue;

    totalSalesSum += r.salesCount;
    totalRevenueSum += estRev;

    if (!departmentMap.has(depName)) {
      departmentMap.set(depName, {
        department: depName,
        spend: r.dailySpend,
        sales: r.salesCount,
        cpa: 0,
        revenue: estRev,
        roas: 0,
        percentage: 0,
      });
    } else {
      const ex = departmentMap.get(depName)!;
      ex.spend += r.dailySpend;
      ex.sales += r.salesCount;
      ex.revenue += estRev;
    }
  });

  const rawDepartmentData = Array.from(departmentMap.values()).map((item) => ({
    ...item,
    cpa: item.sales > 0 ? parseFloat((item.spend / item.sales).toFixed(2)) : 0,
    roas: item.spend > 0 ? parseFloat((item.revenue / item.spend).toFixed(2)) : 0,
    percentage: totalSalesSum > 0 ? parseFloat(((item.sales / totalSalesSum) * 100).toFixed(1)) : 0,
  }));

  // Sort department data according to user choice
  const departmentData = [...rawDepartmentData].sort((a, b) => {
    if (departmentSortBy === 'revenue') return b.revenue - a.revenue;
    if (departmentSortBy === 'cpa') {
      if (a.cpa === 0) return 1;
      if (b.cpa === 0) return -1;
      return a.cpa - b.cpa;
    }
    return b.sales - a.sales;
  });

  // Top Winning Ads / Creatives
  const winningAds = [...records]
    .filter((r) => r.salesCount > 0)
    .sort((a, b) => a.cpa - b.cpa)
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Winning Ads Showcase */}
      {winningAds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Creativos Ganadores de Meta Ads (Menor CPA)</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    TOP ROI
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Los anuncios más eficientes y rentables convirtiendo mensajes de WhatsApp
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {winningAds.map((ad, idx) => (
              <div
                key={ad.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-xs hover:border-cyan-500/50 transition-colors"
              >
                {/* Ranking Medal & Thumb */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden border border-slate-700 flex items-center justify-center">
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} alt={ad.defaultProduct} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                    #{idx + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate" title={ad.defaultProduct}>
                    {ad.defaultProduct}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono text-cyan-400 font-bold">#{ad.adId || 'Sin ID'}</span>
                    <span>• {ad.salesCount} ventas</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black font-mono text-emerald-400">
                      CPA: S/ {ad.cpa.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Grid 1: Temporal & Product Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Spend vs Sales & CPA Over Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Inversión Meta Ads vs Ventas WhatsApp</span>
              </h3>
              <p className="text-xs text-slate-500">Tendencia de gasto publicitario y pedidos diarios</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'spend') return [`S/ ${Number(value).toFixed(2)}`, 'Gasto Publicidad'];
                      if (name === 'sales') return [`${value} pedidos`, 'Ventas'];
                      if (name === 'cpa') return [`S/ ${Number(value).toFixed(2)}`, 'CPA'];
                      return [value, name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) => {
                      if (value === 'spend') return 'Gasto Meta Ads (S/)';
                      if (value === 'sales') return 'Ventas WhatsApp (Und)';
                      if (value === 'cpa') return 'CPA Promedio (S/)';
                      return value;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="right" dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="left" type="monotone" dataKey="cpa" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No hay datos suficientes para graficar en este rango
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Product Breakdown & ROAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Rendimiento por Producto / Campaña</span>
              </h3>
              <p className="text-xs text-slate-500">Distribución de ventas e ingresos por artículo</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {productData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productData.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    dataKey="product"
                    type="category"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'sales') return [`${value} pedidos`, 'Ventas'];
                      if (name === 'spend') return [`S/ ${Number(value).toFixed(2)}`, 'Gasto Publicidad'];
                      if (name === 'cpa') return [`S/ ${Number(value).toFixed(2)}`, 'CPA'];
                      if (name === 'roas') return [`${Number(value).toFixed(2)}x`, 'ROAS Estimado'];
                      return [value, name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) => {
                      if (value === 'sales') return 'Ventas Totales';
                      if (value === 'cpa') return 'CPA (S/)';
                      return value;
                    }}
                  />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                  <Bar dataKey="cpa" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Sin datos de productos registrados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW SECTION: VENTAS POR DEPARTAMENTO SEGÚN LO VENDIDO */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
        {/* Department Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Ventas y Rendimiento por Departamento</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {departmentData.length} Regiones
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Desglose geográfico de pedidos, facturación generada y CPA por departamento
                </p>
              </div>
            </div>
          </div>

          {/* Department Sorting Controls */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDepartmentSortBy('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                departmentSortBy === 'sales'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Más Vendidos
            </button>
            <button
              type="button"
              onClick={() => setDepartmentSortBy('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                departmentSortBy === 'revenue'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mayor Facturación (S/)
            </button>
            <button
              type="button"
              onClick={() => setDepartmentSortBy('cpa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                departmentSortBy === 'cpa'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menor CPA
            </button>
          </div>
        </div>

        {/* Department Dual Charts Grid: Bar Breakdown + Donut Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bar Chart: Sales & Revenue by Department */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Ranking de Ventas y Facturación por Región</span>
              </span>
              <span className="text-[11px] text-slate-400">Top departamentos</span>
            </div>

            <div className="h-72 w-full">
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      dataKey="department"
                      type="category"
                      tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, name: any) => {
                        if (name === 'sales') return [`${value} pedidos (${departmentData.find(d => d.sales === value)?.percentage || 0}%)`, 'Ventas'];
                        if (name === 'revenue') return [`S/ ${Number(value).toFixed(2)}`, 'Facturación'];
                        if (name === 'spend') return [`S/ ${Number(value).toFixed(2)}`, 'Gasto Publicidad'];
                        if (name === 'cpa') return [`S/ ${Number(value).toFixed(2)}`, 'CPA'];
                        return [value, name];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={(value) => {
                        if (value === 'sales') return 'Pedidos Vendidos (Und)';
                        if (value === 'revenue') return 'Facturación Estimada (S/)';
                        return value;
                      }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Sin registros de departamentos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Donut Chart: Regional Share Percentage */}
          <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <PieChartIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Distribución de Mercado (%)</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-600">
                  Total: {totalSalesSum} und.
                </span>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="sales"
                        nameKey="department"
                      >
                        {departmentData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          borderRadius: '10px',
                          border: 'none',
                          fontSize: '11px',
                        }}
                        formatter={(val: any, name: any) => [
                          `${val} pedidos (${((Number(val) / (totalSalesSum || 1)) * 100).toFixed(1)}%)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">Sin datos</p>
                )}
              </div>
            </div>

            {/* Department mini legend chips */}
            <div className="space-y-1 pt-2 border-t border-slate-200 max-h-28 overflow-y-auto pr-1">
              {departmentData.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-700 truncate">{item.department}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span className="text-slate-500">{item.sales} und</span>
                    <span className="font-bold text-slate-900">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Ranking Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {departmentData.slice(0, 4).map((dep, index) => (
            <div
              key={dep.department}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200 transition-all group/dep"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white ${
                      index === 0
                        ? 'bg-amber-500 shadow-2xs'
                        : index === 1
                        ? 'bg-slate-400 shadow-2xs'
                        : index === 2
                        ? 'bg-amber-700 shadow-2xs'
                        : 'bg-blue-600'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-900 truncate" title={dep.department}>
                    {dep.department}
                  </span>
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                  {dep.percentage}%
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Pedidos:</span>
                  <span className="font-black text-slate-900 font-mono text-xs">{dep.sales} und.</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Ingresos:</span>
                  <span className="font-black text-emerald-700 font-mono text-xs">
                    S/ {dep.revenue.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Gasto Ads:</span>
                  <span className="font-bold text-slate-700 font-mono">
                    S/ {dep.spend.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">CPA:</span>
                  <span className="font-bold text-blue-700 font-mono">
                    S/ {dep.cpa.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Mini visual progress bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(8, dep.percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

