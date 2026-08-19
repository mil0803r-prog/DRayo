import React, { useState } from 'react';
import { MetaAdExpense, Product, PricingCalculationRecord } from '../types';
import {
  Megaphone,
  Search,
  Plus,
  Filter,
  FileText,
  CheckCircle2,
  DollarSign,
  Calendar,
  CreditCard,
  Building2,
  Calculator,
  Package,
  Sparkles,
  Trash2,
  Tag
} from 'lucide-react';

interface MetaAdsViewProps {
  metaExpenses: MetaAdExpense[];
  onAddExpense: (expense: MetaAdExpense) => void;
  onOpenNewExpenseModal: () => void;
  products?: Product[];
  pricingRecords?: PricingCalculationRecord[];
  onDeleteExpense?: (id: string) => void;
}

export const MetaAdsView: React.FC<MetaAdsViewProps> = ({
  metaExpenses,
  onOpenNewExpenseModal,
  products = [],
  pricingRecords = [],
  onDeleteExpense,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Months available
  const monthOptions = [
    { key: 'all', label: 'Todos los Meses' },
    { key: '2026-03', label: 'Marzo 2026' },
    { key: '2026-04', label: 'Abril 2026' },
    { key: '2026-05', label: 'Mayo 2026' },
    { key: '2026-06', label: 'Junio 2026' },
    { key: '2026-07', label: 'Julio 2026' },
    { key: '2026-08', label: 'Agosto 2026' },
  ];

  // Distinct accounts
  const distinctAccounts = Array.from(
    new Set(metaExpenses.map((e) => e.adAccount || "D'RAYO (1334036197186369)"))
  );

  // Distinct products from expenses
  const distinctProducts = Array.from(
    new Set(metaExpenses.map((e) => e.productName).filter(Boolean) as string[])
  );

  // Filtering
  const filteredExpenses = metaExpenses.filter((e) => {
    const accountName = e.adAccount || "D'RAYO (1334036197186369)";
    const matchesMonth = selectedMonth === 'all' || e.monthKey === selectedMonth;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || accountName === accountFilter;
    const matchesProduct = productFilter === 'all' || e.productName === productFilter;
    const matchesSearch =
      e.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.includes(searchTerm) ||
      (e.productName && e.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.adAccount && e.adAccount.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.amount.toString().includes(searchTerm);

    return matchesMonth && matchesStatus && matchesAccount && matchesProduct && matchesSearch;
  });

  // Calculate totals for active filter
  const totalFacturado = filteredExpenses
    .filter((e) => e.status === 'Pagado')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalFondosAgregados = filteredExpenses
    .filter((e) => e.status === 'Fondos agregados')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalGlobalSum = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200/80 rounded-xl">
                <Megaphone className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Gastos Publicitarios & Meta Ads</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Control de facturas, cuentas publicitarias y vinculación automática con los productos y ofertas de la <strong className="text-blue-700 font-semibold">Calculadora de Precios</strong>.
            </p>
          </div>

          <button
            onClick={onOpenNewExpenseModal}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs shadow-blue-600/20 text-xs sm:text-sm whitespace-nowrap active:scale-95 self-start md:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Gasto Meta</span>
          </button>
        </div>

        {/* Month Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-4 border-t border-slate-100 no-scrollbar">
          {monthOptions.map((m) => {
            const isActive = selectedMonth === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMonth(m.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards for filtered Meta Ads spend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Importe Facturado (Pagado)</p>
          <h3 className="text-xl font-extrabold text-blue-600 mt-1 font-mono">S/ {totalFacturado.toFixed(2)} PEN</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="font-mono text-slate-700">{filteredExpenses.filter((e) => e.status === 'Pagado').length}</strong> cargos directos
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fondos Agregados</p>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">S/ {totalFondosAgregados.toFixed(2)} PEN</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="font-mono text-slate-700">{filteredExpenses.filter((e) => e.status === 'Fondos agregados').length}</strong> recargas de saldo
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registros Mostrados</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{filteredExpenses.length} Transacciones</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Suma total visualizada: <strong className="text-amber-600 font-mono">S/ {totalGlobalSum.toFixed(2)}</strong>
          </p>
        </div>

      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, fecha, producto o cuenta..."
            className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
          />
        </div>

        {/* Filter by Ad Account */}
        <div className="relative">
          <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer shadow-2xs"
          >
            <option value="all">Todas las Cuentas Publicitarias</option>
            {distinctAccounts.map((acc, idx) => (
              <option key={idx} value={acc}>
                {acc}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Product (Calculator or Catalog) */}
        <div className="relative">
          <Calculator className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer shadow-2xs"
          >
            <option value="all">Todos los Productos / Ofertas</option>
            {distinctProducts.map((prod, idx) => (
              <option key={idx} value={prod}>
                {prod}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer shadow-2xs"
          >
            <option value="all">Todos los Estados</option>
            <option value="Pagado">Pagado (Cargo directo)</option>
            <option value="Fondos agregados">Fondos agregados (Recarga)</option>
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Cuenta Publicitaria</th>
                <th className="py-3.5 px-4">Producto / Oferta (Calculadora)</th>
                <th className="py-3.5 px-4">Identificador / Notas</th>
                <th className="py-3.5 px-4 text-right">Importe</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Método / Periodo</th>
                {onDeleteExpense && <th className="py-3.5 px-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => {
                  const adAcc = exp.adAccount || "D'RAYO (1334036197186369)";
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Fecha */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {exp.date}
                      </td>

                      {/* Cuenta Publicitaria */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[180px]" title={adAcc}>
                            {adAcc}
                          </span>
                        </span>
                      </td>

                      {/* Producto / Oferta (Calculadora) */}
                      <td className="py-3.5 px-4">
                        {exp.productName ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]" title={exp.productName}>
                                {exp.productName}
                              </span>
                            </div>
                            {exp.cpaTarget !== undefined && exp.cpaTarget > 0 && (
                              <span className="inline-block text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                                CPA Obj: S/ {exp.cpaTarget.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Gasto General</span>
                        )}
                      </td>

                      {/* ID / Notas */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-mono text-slate-600 truncate text-[11px]" title={exp.transactionId}>
                          {exp.transactionId}
                        </div>
                        {exp.notes && (
                          <div className="text-[10px] text-slate-500 truncate" title={exp.notes}>
                            {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Importe */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-sm text-blue-600 font-mono">
                          S/ {exp.amount.toFixed(2)} PEN
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            exp.status === 'Pagado'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>

                      {/* Método / Periodo */}
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        <div className="space-y-0.5">
                          {exp.paymentMethod && (
                            <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                              {exp.paymentMethod}
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {exp.period || 'Manual'}
                          </div>
                        </div>
                      </td>

                      {/* Acciones */}
                      {onDeleteExpense && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            title="Eliminar registro"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No se encontraron transacciones de publicidad con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
