import React, { useState, useMemo } from 'react';
import { IndirectCost, TabType } from '../types';
import { CategorySelect } from './CategorySelect';
import { getStoredIndirectCategories, registerIndirectCategory } from '../lib/storage';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Receipt,
  Scale,
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Calculator,
  ArrowRight,
  ShieldCheck,
  X,
  Sliders
} from 'lucide-react';

interface IndirectCostsViewProps {
  indirectCosts: IndirectCost[];
  onAddIndirectCost: (cost: IndirectCost) => void;
  onUpdateIndirectCost: (cost: IndirectCost) => void;
  onDeleteIndirectCost: (costId: string) => void;
  onBulkDeleteIndirectCosts?: (ids: string[]) => void;
  setActiveTab?: (tab: TabType) => void;
  showToast?: (msg: string) => void;
}

const CATEGORIES = [
  'Alquiler',
  'Servicios',
  'Personal',
  'Software',
  'Logística Fija',
  'Financiero/Contable',
  'Mantenimiento',
  'Otros',
];

const PERIODICITIES = ['Mensual', 'Anual', 'Único'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Alquiler: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Servicios: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Personal: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Software: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Logística Fija': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Financiero/Contable': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Mantenimiento: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Otros: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const IndirectCostsView: React.FC<IndirectCostsViewProps> = ({
  indirectCosts,
  onAddIndirectCost,
  onUpdateIndirectCost,
  onDeleteIndirectCost,
  setActiveTab,
  showToast,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const allKnownCategories = useMemo(() => {
    return Array.from(new Set([...getStoredIndirectCategories(), ...indirectCosts.map((c) => c.category).filter(Boolean)]));
  }, [indirectCosts]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCost, setEditingCost] = useState<IndirectCost | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Alquiler');
  const [formAmount, setFormAmount] = useState('');
  const [formPeriodicity, setFormPeriodicity] = useState('Mensual');
  const [formMonthKey, setFormMonthKey] = useState('2026-03');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Unit Allocation Simulator state
  const [simulatedUnits, setSimulatedUnits] = useState<number>(150);

  // Filtered costs
  const filteredCosts = useMemo(() => {
    return indirectCosts.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
      const matchMonth = selectedMonth === 'all' || c.monthKey === selectedMonth;
      return matchSearch && matchCat && matchMonth;
    });
  }, [indirectCosts, searchTerm, selectedCategory, selectedMonth]);

  // Aggregate Metrics
  const activeCosts = indirectCosts.filter((c) => c.isActive !== false);
  const totalMonthlyIndirectCosts = activeCosts.reduce((sum, c) => {
    // Normalise to monthly amount
    if (c.periodicity === 'Anual') return sum + c.amount / 12;
    if (c.periodicity === 'Único') return sum + c.amount; // considered for active month
    return sum + c.amount;
  }, 0);

  const totalFilteredSum = filteredCosts.reduce((sum, c) => sum + c.amount, 0);

  const unitQuota = simulatedUnits > 0 ? totalMonthlyIndirectCosts / simulatedUnits : 0;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    activeCosts.forEach((c) => {
      const amt = c.periodicity === 'Anual' ? c.amount / 12 : c.amount;
      map[c.category] = (map[c.category] || 0) + amt;
    });
    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percent: totalMonthlyIndirectCosts > 0 ? (amount / totalMonthlyIndirectCosts) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeCosts, totalMonthlyIndirectCosts]);

  // Open modal for new cost
  const handleOpenNewModal = () => {
    setEditingCost(null);
    setFormName('');
    setFormCategory('Alquiler');
    setFormAmount('');
    setFormPeriodicity('Mensual');
    setFormMonthKey('2026-03');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormNotes('');
    setFormIsActive(true);
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (cost: IndirectCost) => {
    setEditingCost(cost);
    setFormName(cost.name);
    setFormCategory(cost.category);
    setFormAmount(cost.amount.toString());
    setFormPeriodicity(cost.periodicity || 'Mensual');
    setFormMonthKey(cost.monthKey || '2026-03');
    setFormDate(cost.date || new Date().toISOString().substring(0, 10));
    setFormNotes(cost.notes || '');
    setFormIsActive(cost.isActive !== false);
    setShowModal(true);
  };

  // Save form
  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!formName.trim()) {
      alert('Por favor ingresa un nombre para el costo indirecto.');
      return;
    }
    if (isNaN(amountNum) || amountNum < 0) {
      alert('Por favor ingresa un monto válido mayor o igual a 0.');
      return;
    }

    const finalCategory = formCategory ? formCategory.trim() : 'Otros';
    registerIndirectCategory(finalCategory);

    if (editingCost) {
      const updated: IndirectCost = {
        ...editingCost,
        name: formName.trim(),
        category: finalCategory,
        amount: amountNum,
        periodicity: formPeriodicity,
        monthKey: formMonthKey,
        date: formDate,
        notes: formNotes.trim(),
        isActive: formIsActive,
      };
      onUpdateIndirectCost(updated);
      showToast?.(`Costo indirecto "${updated.name}" actualizado`);
    } else {
      const newCost: IndirectCost = {
        id: `ic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        category: finalCategory,
        amount: amountNum,
        periodicity: formPeriodicity,
        monthKey: formMonthKey,
        date: formDate,
        notes: formNotes.trim(),
        isActive: formIsActive,
      };
      onAddIndirectCost(newCost);
      showToast?.(`Nuevo costo indirecto "${newCost.name}" registrado`);
    }

    setShowModal(false);
  };

  // Toggle active status
  const handleToggleActive = (cost: IndirectCost) => {
    const updated = { ...cost, isActive: cost.isActive === false ? true : false };
    onUpdateIndirectCost(updated);
    showToast?.(`Estado de "${cost.name}" cambiado a ${updated.isActive ? 'Activo' : 'Inactivo'}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Costos Indirectos & Gastos Fijos
            </h1>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Registra y administra los costos de operación fijos (alquiler, taller, servicios, software, personal y gastos contables) que complementan la inversión publicitaria y el costo de producto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Costo Fijo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Costos Indirectos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Fijos Mensuales
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              S/ {totalMonthlyIndirectCosts.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeCosts.length} rubros activos este mes
          </p>
        </div>

        {/* Costo Diario Promedio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Costo Operativo Diario
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              S/ {(totalMonthlyIndirectCosts / 30).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500">/día</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gasto base necesario para operar
          </p>
        </div>

        {/* Cuota por Prenda Simulada */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cuota Asignada / Prenda
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              S/ {unitQuota.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500">/ud</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Basado en {simulatedUnits} prendas estimadas/mes
          </p>
        </div>

        {/* Impacto en Punto de Equilibrio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Punto de Equilibrio
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              Suma a Gastos Meta
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Integrado en <strong className="text-slate-700">Análisis Pro</strong>
          </p>
        </div>
      </div>

      {/* Simulator & Distribution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Unit Prorrateo Simulator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Simulador de Absorción de Costos Indirectos por Prenda
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajusta el volumen mensual proyectado de ventas para saber cuánto costo fijo debe absorber cada prenda vendida.
              </p>
            </div>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Ver Punto de Equilibrio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-2">
                <span>Volumen de Ventas Mensuales Proyectadas:</span>
                <span className="text-base font-bold text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-md border border-indigo-100">
                  {simulatedUnits} unidades / mes
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="800"
                step="10"
                value={simulatedUnits}
                onChange={(e) => setSimulatedUnits(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>20 prendas (Micro)</span>
                <span>200 prendas (Medio)</span>
                <span>500 prendas (Escala)</span>
                <span>800 prendas (Alto flujo)</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-xs text-slate-500 font-medium">Gasto Fijo Total Mensual</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  S/ {totalMonthlyIndirectCosts.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Cuota Indirecta Unitaria</p>
                <p className="text-base font-bold text-amber-600 mt-0.5">
                  S/ {unitQuota.toFixed(2)} por prenda
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Impacto en Margen</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Cada prenda vendida contribuye con <strong className="text-slate-900">S/ {unitQuota.toFixed(2)}</strong> a pagar tus costos fijos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              Distribución por Rubro
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Porcentaje de gastos fijos por categoría
            </p>

            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No hay costos indirectos registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((item) => {
                  const style = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Otros'];
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{item.category}</span>
                        <span className="text-slate-900">
                          S/ {item.amount.toFixed(2)} ({item.percent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Total categorías activas:</span>
            <span className="font-bold text-slate-800">{categoryBreakdown.length}</span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por concepto o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-56 sm:w-64"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas las categorías</option>
                {allKnownCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Mostrando {filteredCosts.length} de {indirectCosts.length} registros | Total:{' '}
            <strong className="text-slate-900">S/ {totalFilteredSum.toFixed(2)}</strong>
          </div>
        </div>

        {/* Table Content */}
        {filteredCosts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No se encontraron costos indirectos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Prueba ajustando los filtros de búsqueda o categoría.'
                : 'Empieza registrando los costos fijos de tu taller, alquiler o herramientas de software.'}
            </p>
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Primer Costo Fijo</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Concepto / Nombre</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Periodicidad</th>
                  <th className="py-3 px-4">Fecha / Mes</th>
                  <th className="py-3 px-4 text-right">Monto (S/)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCosts.map((cost) => {
                  const catStyle = CATEGORY_COLORS[cost.category] || CATEGORY_COLORS['Otros'];
                  const isActive = cost.isActive !== false;
                  return (
                    <tr
                      key={cost.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? 'opacity-50 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{cost.name}</div>
                        {cost.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{cost.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {cost.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{cost.periodicity || 'Mensual'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {cost.date || cost.monthKey || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-sm text-slate-900">
                        S/ {cost.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cost)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(cost)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar costo indirecto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar el costo "${cost.name}"?`)) {
                                onDeleteIndirectCost(cost.id);
                                showToast?.(`Costo "${cost.name}" eliminado`);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar costo indirecto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Cost */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCost ? 'Editar Costo Indirecto' : 'Nuevo Costo Indirecto / Fijo'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alquiler, servicios, software y administración
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCost} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Concepto / Nombre */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Concepto / Descripción del Gasto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Alquiler de Taller, Luz Comercial, Shopify..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-2xs font-semibold text-slate-900"
                />
              </div>

              {/* Categoría con Selector Manual / Desplegable */}
              <div>
                <CategorySelect
                  value={formCategory}
                  onChange={setFormCategory}
                  existingCategories={allKnownCategories}
                  categoryType="indirect"
                  themeColor="indigo"
                  label="Categoría del Costo"
                />
              </div>

              {/* Periodicidad & Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periodicidad</label>
                  <select
                    value={formPeriodicity}
                    onChange={(e) => setFormPeriodicity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white cursor-pointer shadow-2xs font-medium"
                  >
                    {PERIODICITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      if (e.target.value.length >= 7) {
                        setFormMonthKey(e.target.value.substring(0, 7));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-2xs font-medium"
                  />
                </div>
              </div>

              {/* Monto & Fecha */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Monto Total (S/) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Notas opcionales */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Proveedor (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el contrato, comprobante, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none shadow-2xs"
                />
              </div>

              {/* Estado Activo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Costo Activo (Incluir en cálculos de Punto de Equilibrio)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  {editingCost ? 'Guardar Cambios' : 'Registrar Costo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
