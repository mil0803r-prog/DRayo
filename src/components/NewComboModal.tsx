import React, { useState } from 'react';
import { Product, ComboItem } from '../types';
import { X, Layers, Plus, Trash2, Package, Sparkles, AlertCircle } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { registerCategory } from '../lib/storage';

interface NewComboModalProps {
  products: Product[];
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  existingCategories?: string[];
}

export const NewComboModal: React.FC<NewComboModalProps> = ({
  products,
  onClose,
  onSaveProduct,
  existingCategories = [],
}) => {
  const [sku, setSku] = useState(`CMB-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Combos y Packs');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>(3);
  const [notes, setNotes] = useState('');

  // Included products in the combo
  const [comboItems, setComboItems] = useState<ComboItem[]>([
    { productName: '', quantity: 1, unitCost: 0 },
    { productName: '', quantity: 1, unitCost: 0 },
  ]);

  // Calculate total cost from all included items
  const totalCost = comboItems.reduce((sum, item) => {
    const itemCost = Number(item.unitCost) || 0;
    const itemQty = Number(item.quantity) || 1;
    return sum + itemCost * itemQty;
  }, 0);

  const salePriceNum = Number(salePrice) || 0;
  const grossProfit = salePriceNum > 0 ? salePriceNum - totalCost : 0;
  const marginPct = salePriceNum > 0 ? (grossProfit / salePriceNum) * 100 : 0;

  const handleAddComboItem = () => {
    setComboItems([...comboItems, { productName: '', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveComboItem = (index: number) => {
    if (comboItems.length <= 1) return;
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  const handleUpdateComboItem = (index: number, updates: Partial<ComboItem>) => {
    const updated = [...comboItems];
    updated[index] = { ...updated[index], ...updates };
    setComboItems(updated);
  };

  const handleSelectExistingProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    handleUpdateComboItem(index, {
      productId: prod.id,
      productName: prod.name,
      unitCost: prod.costPrice || 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || salePrice === '') return;

    const finalCat = category ? category.trim() : 'Combos y Packs';
    registerCategory(finalCat);

    // Filter valid combo items
    const validItems = comboItems.filter((item) => item.productName.trim().length > 0);

    const newCombo: Product = {
      id: `p-cmb-${Date.now()}`,
      sku,
      name: name.trim(),
      category: finalCat,
      costPrice: totalCost,
      salePrice: salePriceNum,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      notes: notes || undefined,
      type: 'combo',
      comboItems: validItems.length > 0 ? validItems : undefined,
    };

    onSaveProduct(newCombo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-purple-200 rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 p-4 sm:p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-white shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Nuevo Combo / Pack</span>
                <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-purple-200">
                  Precio Único
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Agrupa productos con un solo precio de venta y control de stock centralizado.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* SKU & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">SKU del Combo *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500 font-mono shadow-2xs"
              />
            </div>

            <div>
              <CategorySelect
                value={category}
                onChange={setCategory}
                existingCategories={existingCategories}
                label="Categoría del Combo"
                themeColor="purple"
              />
            </div>
          </div>

          {/* Combo Name */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Nombre del Combo o Pack *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pack 2 Polos Oversize + Gorra Streetwear"
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500 font-bold shadow-2xs text-sm"
            />
          </div>

          {/* Section: Included Products in Combo */}
          <div className="bg-purple-50/50 border border-purple-200/70 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Package className="w-3.5 h-3.5 text-purple-600" />
                <span>Prendas / Productos que componen el Combo</span>
              </label>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
                {comboItems.length} {comboItems.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Selecciona productos existentes o escribe el nombre y costo de cada uno para calcular el costo total.
            </p>

            <div className="space-y-2">
              {comboItems.map((item, index) => {
                const itemTotal = (Number(item.unitCost) || 0) * (Number(item.quantity) || 1);
                return (
                  <div
                    key={index}
                    className="bg-white border border-purple-100 rounded-xl p-2.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[11px] text-purple-800 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 text-[10px] flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span>Producto {index + 1}</span>
                      </span>

                      {comboItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveComboItem(index)}
                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Eliminar producto del combo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      {/* Product Name / Selection */}
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Nombre de la prenda o ítem..."
                          value={item.productName}
                          onChange={(e) => handleUpdateComboItem(index, { productName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 text-xs font-semibold"
                        />
                        {products.length > 0 && (
                          <div className="mt-1">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) handleSelectExistingProduct(index, e.target.value);
                              }}
                              className="w-full bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md text-[10px] focus:outline-none cursor-pointer"
                            >
                              <option value="">⚡ Autocompletar desde Inventario...</option>
                              {products
                                .filter((p) => p.type !== 'combo')
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Costo: S/ {p.costPrice.toFixed(2)})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateComboItem(index, {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 text-xs font-mono text-center font-bold"
                        />
                      </div>

                      {/* Cost per unit */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Costo Unit. (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          value={item.unitCost === 0 ? '' : item.unitCost}
                          onChange={(e) =>
                            handleUpdateComboItem(index, {
                              unitCost: e.target.value === '' ? 0 : parseFloat(e.target.value),
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      Subtotal costo: <strong className="text-slate-800">S/ {itemTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleAddComboItem}
                className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-100/80 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Agregar otro producto al combo</span>
              </button>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Costo Total del Combo:</span>
                <span className="text-xs font-bold font-mono text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                  S/ {totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* SINGLE COMBO SALE PRICE */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-900 font-bold block text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Precio Único de Venta del Combo (S/) *</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                1 solo precio para el combo
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-base">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-white border-2 border-emerald-300 text-emerald-900 pl-10 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-mono font-extrabold text-base shadow-2xs"
              />
            </div>

            {salePriceNum > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white/80 border border-emerald-100 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-slate-500 block">Margen de Ganancia</span>
                  <span className="font-mono font-bold text-xs text-emerald-700">
                    S/ {grossProfit.toFixed(2)}
                  </span>
                </div>
                <div className="bg-white/80 border border-emerald-100 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-slate-500 block">% Rentabilidad</span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      marginPct >= 30 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {marginPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stock & Stock Alert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Stock Inicial de Combos *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500 font-mono font-bold shadow-2xs text-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Packs armados / disponibles</span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Alerta de Stock Mínimo *
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="3"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500 font-mono shadow-2xs text-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Aviso al llegar a esta cantidad</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Notas / Descripción del Combo</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Incluye 2 polos a elección + packaging de regalo y stickers."
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500 text-xs resize-none shadow-2xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-purple-600/20 active:scale-95 text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Guardar Combo en Inventario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
