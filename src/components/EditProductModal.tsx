import React, { useState } from 'react';
import { Product, ComboItem } from '../types';
import { X, Edit2, Package, Layers, Plus, Trash2, Sparkles } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { registerCategory } from '../lib/storage';

interface EditProductModalProps {
  product: Product;
  products?: Product[];
  onClose: () => void;
  onSaveProduct: (updatedProduct: Product) => void;
  existingCategories?: string[];
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  products = [],
  onClose,
  onSaveProduct,
  existingCategories = [],
}) => {
  const isCombo = product.type === 'combo';
  const [sku, setSku] = useState(product.sku);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [costPrice, setCostPrice] = useState<number | ''>(product.costPrice ?? '');
  const [salePrice, setSalePrice] = useState<number | ''>(product.salePrice ?? '');
  const [stock, setStock] = useState<number | ''>(product.stock ?? '');
  const [minStock, setMinStock] = useState<number | ''>(product.minStock ?? '');
  const [notes, setNotes] = useState(product.notes || '');

  // Combo items if it's a combo
  const [comboItems, setComboItems] = useState<ComboItem[]>(() => {
    if (product.comboItems && product.comboItems.length > 0) {
      return product.comboItems;
    }
    return [
      { productName: '', quantity: 1, unitCost: 0 },
      { productName: '', quantity: 1, unitCost: 0 },
    ];
  });

  const totalCalculatedCost = isCombo
    ? comboItems.reduce((sum, it) => sum + (Number(it.unitCost) || 0) * (Number(it.quantity) || 1), 0)
    : Number(costPrice) || 0;

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
    if (!name || salePrice === '') return;
    if (!isCombo && costPrice === '') return;

    const finalCat = category ? category.trim() : isCombo ? 'Combos y Packs' : 'General';
    registerCategory(finalCat);

    const validComboItems = comboItems.filter((it) => it.productName.trim().length > 0);

    const updated: Product = {
      ...product,
      sku,
      name,
      category: finalCat,
      costPrice: isCombo ? totalCalculatedCost : Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      notes: notes || undefined,
      type: product.type || (isCombo ? 'combo' : 'individual'),
      comboItems: isCombo && validComboItems.length > 0 ? validComboItems : product.comboItems,
    };

    onSaveProduct(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className={`flex items-center justify-between border-b p-4 sm:p-5 shrink-0 rounded-t-2xl ${
          isCombo ? 'border-purple-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-white' : 'border-slate-100'
        }`}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {isCombo ? (
              <>
                <Layers className="w-5 h-5 text-purple-600" />
                <span>Editar Combo / Pack</span>
                <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Combo
                </span>
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Editar Producto del Inventario</span>
              </>
            )}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">SKU *</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
            />
          </div>

          <div>
            <CategorySelect
              value={category}
              onChange={setCategory}
              existingCategories={existingCategories}
              label={isCombo ? 'Categoría del Combo' : 'Categoría del Producto'}
              themeColor={isCombo ? 'purple' : 'blue'}
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {isCombo ? 'Nombre del Combo / Pack *' : 'Nombre de la Prenda / Producto *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCombo ? 'Ej: Pack 2 Polos + Gorra' : "Ej: Polera D'RAYO Street"}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-bold shadow-2xs"
            />
          </div>

          {/* If Combo, show items list */}
          {isCombo ? (
            <div className="bg-purple-50/50 border border-purple-200/70 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Package className="w-3.5 h-3.5 text-purple-600" />
                  <span>Prendas en el Combo</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddComboItem}
                  className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar prenda</span>
                </button>
              </div>

              <div className="space-y-2">
                {comboItems.map((item, idx) => (
                  <div key={idx} className="bg-white border border-purple-100 rounded-lg p-2 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700">Ítem #{idx + 1}</span>
                      {comboItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveComboItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-12 gap-1.5">
                      <input
                        type="text"
                        placeholder="Nombre prenda..."
                        value={item.productName}
                        onChange={(e) => handleUpdateComboItem(idx, { productName: e.target.value })}
                        className="col-span-6 bg-slate-50 border border-slate-200 text-slate-900 px-2 py-1 rounded text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateComboItem(idx, {
                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="col-span-3 bg-slate-50 border border-slate-200 text-slate-900 px-2 py-1 rounded text-xs font-mono text-center font-bold"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Costo"
                        value={item.unitCost === 0 ? '' : item.unitCost}
                        onChange={(e) =>
                          handleUpdateComboItem(idx, {
                            unitCost: e.target.value === '' ? 0 : parseFloat(e.target.value),
                          })
                        }
                        className="col-span-3 bg-slate-50 border border-slate-200 text-slate-900 px-2 py-1 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-purple-100 text-xs">
                <span className="text-slate-500 text-[11px]">Costo Total del Combo:</span>
                <span className="font-mono font-bold text-purple-900">S/ {totalCalculatedCost.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Costo Unitario (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Precio Venta (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-emerald-600 font-bold shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Single combo sale price if combo */}
          {isCombo && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-900 font-bold block text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Precio Único de Venta del Combo (S/) *</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Precio Final
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-white border-2 border-emerald-300 text-emerald-900 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono font-bold text-sm shadow-2xs"
                />
              </div>
            </div>
          )}

          {!isCombo && typeof costPrice === 'number' && costPrice > 0 && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">💡 Precios de Venta Sugeridos:</span>
                <span className="text-[10px] text-slate-400">Toca para aplicar</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSalePrice(Math.round(costPrice * 2.0))}
                  className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  S/ {Math.round(costPrice * 2.0)} (2.0x)
                </button>
                <button
                  type="button"
                  onClick={() => setSalePrice(Math.round(costPrice * 2.3))}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg font-mono text-[11px] font-black text-emerald-800 cursor-pointer"
                >
                  S/ {Math.round(costPrice * 2.3)} ★ Recomendado (2.3x)
                </button>
                <button
                  type="button"
                  onClick={() => setSalePrice(Math.round(costPrice * 2.8))}
                  className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  S/ {Math.round(costPrice * 2.8)} (2.8x)
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                {isCombo ? 'Stock de Combos (unidades)' : 'Stock Actual (unidades)'}
              </label>
              <input
                type="number"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                placeholder="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {isCombo ? 'Notas / Descripción del Combo' : 'Notas / Detalles de fabricación'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isCombo ? 'Ej: Pack de temporada...' : 'Ej: Algodón reactivo 300g...'}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${
                isCombo
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer`}
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
