import React, { useState } from 'react';
import { Product } from '../types';
import { X, Package, Tag, DollarSign } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { registerCategory } from '../lib/storage';

interface NewProductModalProps {
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  existingCategories?: string[];
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  onClose,
  onSaveProduct,
  existingCategories = [],
}) => {
  const [sku, setSku] = useState(`DRY-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ropa / Poleras');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || costPrice === '' || salePrice === '') return;

    const finalCat = category ? category.trim() : 'General';
    registerCategory(finalCat);

    const newProd: Product = {
      id: `p-${Date.now()}`,
      sku,
      name,
      category: finalCat,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      notes: notes || undefined,
    };

    onSaveProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Agregar Nuevo Producto al Inventario
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
              label="Categoría del Producto"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Nombre de la Prenda / Producto *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Polera D'RAYO Street Heavyweight"
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-bold shadow-2xs"
            />
          </div>

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

          {typeof costPrice === 'number' && costPrice > 0 && (
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
              <label className="text-slate-700 font-semibold block mb-1">Stock Inicial (unidades)</label>
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
            <label className="text-slate-700 font-semibold block mb-1">Notas / Detalles de fabricación</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Algodón reactivo 300g..."
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
