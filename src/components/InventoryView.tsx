import React, { useState } from 'react';
import { Product } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  Box,
  TrendingUp,
} from 'lucide-react';
import { EditProductModal } from './EditProductModal';
import { getStoredCategories } from '../lib/storage';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onDeleteProduct: (productId: string) => void;
  onEditProduct?: (updatedProduct: Product) => void;
  onOpenNewProductModal: () => void;
  onOpenNewComboModal?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onUpdateStock,
  onDeleteProduct,
  onEditProduct,
  onOpenNewProductModal,
  onOpenNewComboModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'individual' | 'combo'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const allKnownCategories = Array.from(
    new Set([...getStoredCategories(), ...products.map((p) => p.category).filter(Boolean)])
  );
  const categories = ['all', ...allKnownCategories];

  const totalCombos = products.filter((p) => p.type === 'combo').length;
  const totalIndividuals = products.filter((p) => p.type !== 'combo').length;

  const filteredProducts = products.filter((p) => {
    const isCombo = p.type === 'combo';
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'combo' && isCombo) ||
      (selectedType === 'individual' && !isCombo);

    const comboItemsText = p.comboItems ? p.comboItems.map((ci) => ci.productName).join(' ') : '';
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comboItemsText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && matchesType;
  });

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Inventario y Catálogo</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                {totalIndividuals} Productos
              </span>
              <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>{totalCombos} Combos / Packs</span>
              </span>
            </div>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestiona productos individuales con costo y precio, y crea combos con precio único y múltiples prendas.
          </p>
        </div>

        {/* Action Buttons: Nuevo Producto & Nuevo Combo */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenNewProductModal}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs shadow-blue-600/20 active:scale-95 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Producto</span>
          </button>

          {onOpenNewComboModal && (
            <button
              onClick={onOpenNewComboModal}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs shadow-purple-600/20 active:scale-95 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Nuevo Combo</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <strong className="font-bold block text-amber-900">
                Alerta de Stock Bajo ({lowStockProducts.length} ítems)
              </strong>
              <span>
                Los siguientes productos o combos han alcanzado o superado el stock mínimo sugerido:{' '}
                {lowStockProducts.map((p) => p.name).join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Type Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Segments */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setSelectedType('individual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'individual'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Productos ({totalIndividuals})</span>
          </button>
          <button
            onClick={() => setSelectedType('combo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'combo'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Combos / Packs ({totalCombos})</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 sm:justify-end">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar SKU, producto o prendas de combo..."
              className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
            />
          </div>

          <div className="relative w-full sm:w-52">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
            >
              <option value="all">Todas las Categorías</option>
              {categories
                .filter((c) => c !== 'all')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tipo / SKU / Nombre</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-right">Costo Total (S/)</th>
                <th className="py-3.5 px-4 text-right">Precio Venta (S/)</th>
                <th className="py-3.5 px-4 text-right">Margen Bruto</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => {
                  const isCombo = prod.type === 'combo';
                  const profitUnit = prod.salePrice - prod.costPrice;
                  const marginPct = prod.salePrice > 0 ? (profitUnit / prod.salePrice) * 100 : 0;
                  const isLowStock = prod.stock <= prod.minStock;

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors ${
                        isCombo ? 'hover:bg-purple-50/40 bg-purple-50/10' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* SKU & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            {prod.sku}
                          </span>
                          {isCombo ? (
                            <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 border border-purple-200">
                              <Layers className="w-2.5 h-2.5" />
                              <span>Combo / Pack</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                              Individual
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-slate-900 text-xs">{prod.name}</p>

                        {/* If Combo: Show included products */}
                        {isCombo && prod.comboItems && prod.comboItems.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-purple-700 font-semibold">Incluye:</span>
                            {prod.comboItems.map((ci, idx) => (
                              <span
                                key={idx}
                                className="bg-white border border-purple-200 text-purple-900 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                              >
                                {ci.quantity > 1 ? `${ci.quantity}x ` : ''}
                                {ci.productName}
                              </span>
                            ))}
                          </div>
                        )}

                        {prod.notes && (
                          <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                            {prod.notes}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isCombo
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {prod.category}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        <span>S/ {prod.costPrice.toFixed(2)}</span>
                        {isCombo && (
                          <span className="text-[9px] text-slate-400 block font-sans">
                            (costo total)
                          </span>
                        )}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-bold text-emerald-600 text-xs sm:text-sm">
                          S/ {prod.salePrice.toFixed(2)}
                        </span>
                        {isCombo && (
                          <span className="text-[9px] text-emerald-700 block font-sans font-semibold">
                            Precio único combo
                          </span>
                        )}
                      </td>

                      {/* Gross Margin */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-amber-600 block font-mono">
                          S/ {profitUnit.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">
                          ({marginPct.toFixed(1)}%)
                        </span>
                      </td>

                      {/* Stock with Steppers */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onUpdateStock(prod.id, Math.max(0, prod.stock - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                            title="Restar 1 de stock"
                          >
                            -
                          </button>

                          <span
                            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full border ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : isCombo
                                ? 'bg-purple-50 text-purple-900 border-purple-200 font-extrabold'
                                : 'bg-slate-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            {prod.stock} {isCombo ? 'packs' : 'un.'}
                          </span>

                          <button
                            onClick={() => onUpdateStock(prod.id, prod.stock + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                            title="Sumar 1 de stock"
                          >
                            +
                          </button>
                        </div>
                        {isLowStock && (
                          <span className="text-[9px] text-rose-600 font-bold block mt-1">
                            Min: {prod.minStock}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            title={isCombo ? 'Editar Combo' : 'Editar producto'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isCombo
                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(prod.id)}
                            title={isCombo ? 'Eliminar Combo' : 'Eliminar producto'}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No se encontraron productos o combos en el inventario con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          products={products}
          existingCategories={allKnownCategories}
          onClose={() => setEditingProduct(null)}
          onSaveProduct={(updated) => {
            if (onEditProduct) {
              onEditProduct(updated);
            }
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
