import React from 'react';
import { DailySaleRecord, Product } from '../../types';
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
  Area
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Award,
  Zap,
  Target,
  BarChart2
} from 'lucide-react';

interface MetaAdsChartsProps {
  records: DailySaleRecord[];
  products: Product[];
}

export const MetaAdsCharts: React.FC<MetaAdsChartsProps> = ({ records, products }) => {
  // Sort records chronologically
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // Group by date for timeline chart
  const dateMap = new Map<
    string,
    { date: string; displayDate: string; spend: number; sales: number; cpa: number; revenue: number }
  >();

  sortedRecords.forEach((r) => {
    const matchedP = products.find(
      (p) => p.name.trim().toLowerCase() === r.defaultProduct.trim().toLowerCase()
    );
    const salePrice = matchedP?.salePrice || 79.0;
    const estRev = r.salesCount * salePrice;

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
    const matchedP = products.find(
      (p) => p.name.trim().toLowerCase() === pName.trim().toLowerCase()
    );
    const salePrice = matchedP?.salePrice || 79.0;
    const estRev = r.salesCount * salePrice;

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

      {/* Main Charts Grid */}
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
    </div>
  );
};
