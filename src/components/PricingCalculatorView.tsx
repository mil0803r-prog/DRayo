import React, { useState } from 'react';
import { Product } from '../types';
import {
  Calculator,
  Package,
  Sparkles,
  Percent,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Plus,
  Trash2,
  Megaphone,
  Truck,
  ArrowRight,
  Gift,
  ShoppingBag,
  MessageCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Scale
} from 'lucide-react';

interface PricingCalculatorViewProps {
  products: Product[];
  onUpdateProductPrice?: (productId: string, newSalePrice: number, newCostPrice: number) => void;
}

interface ComboItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  costPrice: number;
  regularSalePrice: number;
}

export const PricingCalculatorView: React.FC<PricingCalculatorViewProps> = ({
  products,
  onUpdateProductPrice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'combos'>('individual');

  // ==========================================
  // STATE FOR INDIVIDUAL PRODUCT CALCULATOR
  // ==========================================
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [unitCostPrice, setUnitCostPrice] = useState<number>(30);
  const [unitCpa, setUnitCpa] = useState<number>(15);
  const [unitShipping, setUnitShipping] = useState<number>(10);
  const [unitExtraCost, setUnitExtraCost] = useState<number>(3);
  const [unitSalePrice, setUnitSalePrice] = useState<number>(89);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(35);
  const [calcMode, setCalcMode] = useState<'by_price' | 'by_margin'>('by_price');
  const [copiedUnitText, setCopiedUnitText] = useState(false);
  const [updatedSuccessMsg, setUpdatedSuccessMsg] = useState<string | null>(null);

  // Handle product selection autofill
  const handleSelectIndividualProduct = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setUnitCostPrice(prod.costPrice);
      setUnitSalePrice(prod.salePrice);
    }
  };

  // Calculations for Individual Unit
  const totalUnitExpenseCost = unitCostPrice + unitCpa + unitShipping + unitExtraCost;
  
  // Calculate sale price if mode is by margin
  const effectiveSalePrice = calcMode === 'by_margin'
    ? (100 - targetMarginPercent) > 0
      ? totalUnitExpenseCost / (1 - targetMarginPercent / 100)
      : totalUnitExpenseCost * 1.5
    : unitSalePrice;

  const unitNetProfit = effectiveSalePrice - totalUnitExpenseCost;
  const unitNetMargin = effectiveSalePrice > 0 ? (unitNetProfit / effectiveSalePrice) * 100 : 0;
  const unitRoi = totalUnitExpenseCost > 0 ? (unitNetProfit / totalUnitExpenseCost) * 100 : 0;
  const unitMinRoas = unitCpa > 0 ? effectiveSalePrice / unitCpa : 0;

  // Handle save price to product
  const handleApplyPriceToInventory = () => {
    if (!selectedProductId || !onUpdateProductPrice) return;
    onUpdateProductPrice(selectedProductId, Math.round(effectiveSalePrice), unitCostPrice);
    const prod = products.find((p) => p.id === selectedProductId);
    setUpdatedSuccessMsg(`¡Precio de "${prod?.name || 'Producto'}" actualizado a S/ ${Math.round(effectiveSalePrice).toFixed(2)} en el inventario!`);
    setTimeout(() => setUpdatedSuccessMsg(null), 3500);
  };

  // Copy unit summary
  const handleCopyUnitSummary = () => {
    const summary = `📊 *DESGLOSE DE PRECIO Y MARGEN D'RAYO*
• Costo de Prenda: S/ ${unitCostPrice.toFixed(2)}
• Publicidad (CPA): S/ ${unitCpa.toFixed(2)}
• Envío Incluido: S/ ${unitShipping.toFixed(2)}
• Empaque / Extras: S/ ${unitExtraCost.toFixed(2)}
-------------------------------
💰 *Costo Total:* S/ ${totalUnitExpenseCost.toFixed(2)}
🏷️ *Precio de Venta:* S/ ${effectiveSalePrice.toFixed(2)}
📈 *Ganancia Neta:* S/ ${unitNetProfit.toFixed(2)} (${unitNetMargin.toFixed(1)}% Margen)
🎯 *ROAS Mínimo:* ${unitMinRoas.toFixed(2)}x`;
    navigator.clipboard.writeText(summary);
    setCopiedUnitText(true);
    setTimeout(() => setCopiedUnitText(false), 2500);
  };


  // ==========================================
  // STATE FOR COMBOS & PACKS CALCULATOR
  // ==========================================
  const [comboTitle, setComboTitle] = useState<string>("Combo D'RAYO 2X Oversize");
  const [comboItems, setComboItems] = useState<ComboItem[]>([
    {
      id: '1',
      productId: products[0]?.id || 'p1',
      name: products[0]?.name || 'Polera Oversize D\'RAYO',
      quantity: 2,
      costPrice: products[0]?.costPrice || 35,
      regularSalePrice: products[0]?.salePrice || 79,
    }
  ]);

  const [comboCpa, setComboCpa] = useState<number>(22);
  const [comboShipping, setComboShipping] = useState<number>(10);
  const [comboPackaging, setComboPackaging] = useState<number>(4);
  const [comboTargetPrice, setComboTargetPrice] = useState<number>(119);
  const [copiedComboMsg, setCopiedComboMsg] = useState(false);

  // Add Item to Combo
  const handleAddComboItem = () => {
    const defaultProd = products[0];
    const newItem: ComboItem = {
      id: Date.now().toString(),
      productId: defaultProd?.id || '',
      name: defaultProd?.name || 'Prenda D\'RAYO Extra',
      quantity: 1,
      costPrice: defaultProd?.costPrice || 30,
      regularSalePrice: defaultProd?.salePrice || 79,
    };
    setComboItems((prev) => [...prev, newItem]);
  };

  // Update Item in Combo
  const handleUpdateComboItem = (id: string, field: keyof ComboItem, value: any) => {
    setComboItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === 'productId') {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            return {
              ...item,
              productId: prod.id,
              name: prod.name,
              costPrice: prod.costPrice,
              regularSalePrice: prod.salePrice,
            };
          }
        }
        return { ...item, [field]: value };
      })
    );
  };

  // Remove Item from Combo
  const handleRemoveComboItem = (id: string) => {
    if (comboItems.length <= 1) return;
    setComboItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations for Combos
  const totalComboProductsCost = comboItems.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
  const totalComboRegularRetail = comboItems.reduce((sum, i) => sum + i.regularSalePrice * i.quantity, 0);
  const totalComboExpenseCost = totalComboProductsCost + comboCpa + comboShipping + comboPackaging;

  const customerSavingsAmount = totalComboRegularRetail - comboTargetPrice;
  const customerSavingsPercent = totalComboRegularRetail > 0 ? (customerSavingsAmount / totalComboRegularRetail) * 100 : 0;

  const comboNetProfit = comboTargetPrice - totalComboExpenseCost;
  const comboNetMargin = comboTargetPrice > 0 ? (comboNetProfit / comboTargetPrice) * 100 : 0;
  const comboRoi = totalComboExpenseCost > 0 ? (comboNetProfit / totalComboExpenseCost) * 100 : 0;
  const comboRoas = comboCpa > 0 ? comboTargetPrice / comboCpa : 0;

  // Preset Strategy Quick Buttons
  const applyPresetStrategy = (type: '2x_discount' | '3x2' | 'free_shipping_10_off' | 'second_half_price') => {
    if (comboItems.length === 0) return;

    if (type === 'second_half_price') {
      // Item 1 full price + Item 2 half price
      const item1Price = comboItems[0]?.regularSalePrice || 80;
      const calculatedPrice = item1Price + item1Price * 0.5;
      setComboTargetPrice(Math.round(calculatedPrice));
      setComboTitle("Combo 2da Unidad al 50%");
    } else if (type === '2x_discount') {
      // 20% discount off retail sum
      const discounted = totalComboRegularRetail * 0.8;
      setComboTargetPrice(Math.round(discounted));
      setComboTitle("Pack 2X con 20% OFF");
    } else if (type === '3x2') {
      // Pay for 2 items, get 3rd free
      const sortedPrices = comboItems.flatMap((i) => Array(i.quantity).fill(i.regularSalePrice)).sort((a, b) => b - a);
      const payFor2Price = (sortedPrices[0] || 0) + (sortedPrices[1] || 0);
      setComboTargetPrice(Math.round(payFor2Price));
      setComboTitle("Super Pack 3X2 D'RAYO");
    } else if (type === 'free_shipping_10_off') {
      // 10% off retail + Envío gratis
      const price = totalComboRegularRetail * 0.9;
      setComboTargetPrice(Math.round(price));
      setComboShipping(0); // FREE SHIPPING
      setComboTitle("Combo Especial + Envío Gratis 🚀");
    }
  };

  // Generate WhatsApp Copy Message
  const generateWhatsAppCopy = () => {
    const itemsListText = comboItems
      .map((i) => `• ${i.quantity}x ${i.name}`)
      .join('\n');

    return `🔥 *OFERTA ESPECIAL: ${comboTitle.toUpperCase()}* 🔥

Lllévate hoy mismo este paquete exclusivo:
${itemsListText}

💰 *Precio Normal de Lista:* ~S/ ${totalComboRegularRetail.toFixed(2)}~
🎉 *PRECIO OFERTA COMBO:* *S/ ${comboTargetPrice.toFixed(2)}*
⚡ *¡Ahorras S/ ${Math.max(0, customerSavingsAmount).toFixed(2)}!* (${Math.round(customerSavingsPercent)}% de Descuento)

🚀 *Incluye Envío Rápido a Domicilio/Agencia.*

¿Te gustaría reservarlo en tu talla antes de que se agote el stock? Responde con *SI* para separarlo hoy. 📲`;
  };

  const handleCopyComboWhatsApp = () => {
    navigator.clipboard.writeText(generateWhatsAppCopy());
    setCopiedComboMsg(true);
    setTimeout(() => setCopiedComboMsg(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Section Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">Calculadora Estratégica de Precios & Combos</h2>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Margen Real & Ofertas
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Evita pérdidas por costo de anuncios o envíos. Calcula tu precio objetivo unitario o arma combos irresistibles para WhatsApp.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'individual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Por Unidad</span>
          </button>

          <button
            onClick={() => setActiveSubTab('combos')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'combos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            <span>Combos & Packs 2X/3X</span>
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      {updatedSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{updatedSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 1: CALCULADORA POR UNIDAD INDIVIDUAL */}
      {/* ========================================================= */}
      {activeSubTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inputs Section (Left Column) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Estructura de Costos por Prenda</span>
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona una prenda de tu almacén o ingresa los valores de fabricación y anuncios.
              </p>
            </div>

            {/* Select product dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cargar Prenda de Inventario (Opcional):
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectIndividualProduct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Ingreso Manual de Costos --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Costo: S/ {p.costPrice.toFixed(2)} | Actual: S/ {p.salePrice.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Costo de Prenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Costo de Fabricación / Compra (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={unitCostPrice}
                    onChange={(e) => setUnitCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Gasto directo de confección o telas</span>
              </div>

              {/* CPA / Anuncio por prenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Publicidad Asignada (CPA por prenda) (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={unitCpa}
                    onChange={(e) => setUnitCpa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Gasto publicitario para vender 1 unidad</span>
              </div>

              {/* Costo de Envío */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Costo de Envío / Flete Asumido (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={unitShipping}
                    onChange={(e) => setUnitShipping(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Si ofreces Envío Gratis al cliente</span>
              </div>

              {/* Empaque / Extras */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Empaque / Bolsa / Etiquetas / Varios (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={unitExtraCost}
                    onChange={(e) => setUnitExtraCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Bolsa, sticker de regalo, pasarela</span>
              </div>
            </div>

            {/* Target Mode Selector */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Método de Cálculo del Precio:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCalcMode('by_price')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      calcMode === 'by_price' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Fijar Precio Venta (S/)
                  </button>
                  <button
                    onClick={() => setCalcMode('by_margin')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      calcMode === 'by_margin' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Fijar Margen (%)
                  </button>
                </div>
              </div>

              {calcMode === 'by_price' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio de Venta Deseado al Cliente (S/):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={unitSalePrice}
                      onChange={(e) => setUnitSalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-blue-50/50 border border-blue-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono font-black text-blue-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Margen Neto Objetivo sobre Venta (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      step="1"
                      value={targetMarginPercent}
                      onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-indigo-50/50 border border-indigo-300 rounded-xl pl-3 pr-8 py-2.5 text-sm font-mono font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono font-bold">%</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Results Card (Right Column) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resultado Financiero</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Unidad Individual
                </span>
              </div>

              {/* Main Price Big Display */}
              <div>
                <span className="text-xs text-slate-400 font-medium">Precio de Venta Sugerido</span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  S/ {effectiveSalePrice.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                  <span>Costo Total Directo:</span>
                  <span className="font-mono font-bold text-slate-100">S/ {totalUnitExpenseCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Expense Breakdown List */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>📦 Prenda / Confección:</span>
                  <span className="font-mono font-semibold">S/ {unitCostPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-300">
                  <span>📢 Publicidad (CPA):</span>
                  <span className="font-mono font-semibold">S/ {unitCpa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>🚀 Envío / Flete:</span>
                  <span className="font-mono font-semibold">S/ {unitShipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>🏷️ Empaque & Extras:</span>
                  <span className="font-mono font-semibold">S/ {unitExtraCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Margin & Profit Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ganancia Neta</span>
                  <div className={`text-lg font-black font-mono ${unitNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    S/ {unitNetProfit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Por cada unidad vendida</span>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Margen Neto %</span>
                  <div className={`text-lg font-black font-mono ${unitNetMargin >= 25 ? 'text-emerald-400' : unitNetMargin >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {unitNetMargin.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Sobre precio de venta</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">ROI Inversión</span>
                  <div className="text-sm font-bold font-mono text-indigo-300">{unitRoi.toFixed(0)}%</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">ROAS Mínimo Ad</span>
                  <div className="text-sm font-bold font-mono text-amber-300">{unitMinRoas.toFixed(2)}x</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {selectedProductId && onUpdateProductPrice && (
                  <button
                    onClick={handleApplyPriceToInventory}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Actualizar Precio en Inventario</span>
                  </button>
                )}

                <button
                  onClick={handleCopyUnitSummary}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl font-semibold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {copiedUnitText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUnitText ? '¡Copiado!' : 'Copiar Resumen de Costos'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* SUBTAB 2: CALCULADORA DE COMBOS & PACKS (2X, 3X) */}
      {/* ========================================================= */}
      {activeSubTab === 'combos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Combo Builder Inputs (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    <span>Armador de Combo u Oferta</span>
                  </h3>
                  <p className="text-xs text-slate-500">Agrega las prendas que integran la oferta especial.</p>
                </div>

                <button
                  onClick={handleAddComboItem}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Prenda</span>
                </button>
              </div>

              {/* Combo Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Oferta / Combo:
                </label>
                <input
                  type="text"
                  value={comboTitle}
                  onChange={(e) => setComboTitle(e.target.value)}
                  placeholder="ej. Combo 2X Poleras Oversize"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Preset Promo Strategy Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ⚡ Aplicar Estrategia de Precio Rápida:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => applyPresetStrategy('second_half_price')}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                  >
                    2da al 50% OFF
                  </button>
                  <button
                    onClick={() => applyPresetStrategy('2x_discount')}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                  >
                    Pack 20% OFF
                  </button>
                  <button
                    onClick={() => applyPresetStrategy('3x2')}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                  >
                    Lleva 3X2
                  </button>
                  <button
                    onClick={() => applyPresetStrategy('free_shipping_10_off')}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                  >
                    Envío Gratis 🚀
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    📦 Productos Incluidos en este Combo:
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {comboItems.length} {comboItems.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
                
                {comboItems.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                    
                    {/* Item label & dropdown / name */}
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleUpdateComboItem(item.id, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Nombre Personalizado --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} (S/ {p.costPrice})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!item.productId && (
                      <div className="w-full sm:w-36">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateComboItem(item.id, 'name', e.target.value)}
                          placeholder="ej. Prenda 2"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                        />
                      </div>
                    )}

                    {/* Price / Cost Space for this product */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-700">Precio / Costo (S/):</label>
                        <div className="relative mt-0.5">
                          <span className="absolute left-2.5 top-1.5 text-xs text-indigo-400 font-mono font-bold">S/</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.costPrice}
                            onChange={(e) => handleUpdateComboItem(item.id, 'costPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-indigo-50/80 border border-indigo-300 rounded-lg pl-7 pr-2 py-1 text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Cantidad:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={item.quantity}
                          onChange={(e) => handleUpdateComboItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold font-mono text-center mt-0.5"
                        />
                      </div>

                      {comboItems.length > 1 && (
                        <button
                          onClick={() => handleRemoveComboItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer mt-3"
                          title="Quitar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                ))}

                {/* Big Prominent "Agregar Producto" Button */}
                <button
                  onClick={handleAddComboItem}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700 py-2.5 rounded-xl font-extrabold text-xs shadow-md hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>+ Agregar espacio para precio de otro producto</span>
                </button>

                {/* Total Products Cost Summary Banner */}
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700">
                  <span className="font-bold text-slate-800">Costo Total Sumado de Productos:</span>
                  <span className="font-mono font-black text-indigo-700 text-sm">
                    S/ {totalComboProductsCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Additional Combo Expenses Inputs */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPA Anuncios Combo (S/):</label>
                  <input
                    type="number"
                    min="0"
                    value={comboCpa}
                    onChange={(e) => setComboCpa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-blue-600"
                  />
                  <span className="text-[10px] text-slate-400">Gasto Meta Ads por combo vendido</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Costo Envío Combo (S/):</label>
                  <input
                    type="number"
                    min="0"
                    value={comboShipping}
                    onChange={(e) => setComboShipping(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Flete o delivery cobrado/asumido</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Empaque Combo (S/):</label>
                  <input
                    type="number"
                    min="0"
                    value={comboPackaging}
                    onChange={(e) => setComboPackaging(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Caja/Bolsa especial para pack</span>
                </div>
              </div>

              {/* TARGET COMBO PRICE INPUT */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider">
                  🎯 PRECIO FINAL DE OFERTA DEL COMBO AL CLIENTE (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-indigo-500 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={comboTargetPrice}
                    onChange={(e) => setComboTargetPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-indigo-400 rounded-xl pl-9 pr-4 py-2.5 text-lg font-black font-mono text-indigo-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-indigo-900 font-medium pt-1">
                  <span>Precio de Lista Individual Sumado: <strong>S/ {totalComboRegularRetail.toFixed(2)}</strong></span>
                  <span className="text-emerald-700 font-bold">Ahorro Cliente: S/ {Math.max(0, customerSavingsAmount).toFixed(2)} ({customerSavingsPercent.toFixed(0)}%)</span>
                </div>
              </div>

            </div>

          </div>

          {/* Combo Results & WhatsApp Offer Preview (Right Column) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Financial Card */}
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rentabilidad del Combo</span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  Estrategia Pack
                </span>
              </div>

              {/* Combo Main Numbers */}
              <div>
                <span className="text-xs text-slate-400 font-medium">Precio de Oferta del Combo</span>
                <div className="text-3xl font-black font-mono text-amber-400 mt-0.5">
                  S/ {comboTargetPrice.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                  <span>Costo Total Combo (Prendas + Ads + Envío):</span>
                  <span className="font-mono font-bold text-slate-100">S/ {totalComboExpenseCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ganancia Neta</span>
                  <div className={`text-lg font-black font-mono ${comboNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    S/ {comboNetProfit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Por combo vendido</span>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Margen Neto %</span>
                  <div className={`text-lg font-black font-mono ${comboNetMargin >= 25 ? 'text-emerald-400' : comboNetMargin >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {comboNetMargin.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Sobre precio del combo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">ROAS Combo Ad</span>
                  <div className="text-sm font-bold font-mono text-amber-300">{comboRoas.toFixed(2)}x</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">ROI Inversión</span>
                  <div className="text-sm font-bold font-mono text-indigo-300">{comboRoi.toFixed(0)}%</div>
                </div>
              </div>

            </div>

            {/* WhatsApp Offer Generator Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900">Mensaje de Oferta para WhatsApp</h4>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Listo para Enviar</span>
              </div>

              <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-3.5 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {generateWhatsAppCopy()}
              </div>

              <button
                onClick={handleCopyComboWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {copiedComboMsg ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedComboMsg ? '¡Copiado para WhatsApp!' : 'Copiar Oferta para WhatsApp'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
