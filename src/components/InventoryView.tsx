import React, { useState } from 'react';
import { Product } from '../types';
import { Package, Plus, Search, AlertTriangle, Edit2, Trash2, DollarSign, Tag, CheckCircle2 } from 'lucide-react';
import { EditProductModal } from './EditProductModal';
import { getStoredCategories } from '../lib/storage';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onDeleteProduct: (productId: string) => void;
  onEditProduct?: (updatedProduct: Product) => void;
  onOpenNewProductModal: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onUpdateStock,
  onDeleteProduct,
  onEditProduct,
  onOpenNewProductModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const allKnownCategories = Array.from(
    new Set([...getStoredCategories(), ...products.map((p) => p.category).filter(Boolean)])
  );
  const categories = ['all', ...allKnownCategories];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Inventario</span>
            <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
              {products.length} Productos
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Controla el precio de costo (COGS), precio de venta al público y margen de ganancia por prenda.
          </p>
        </div>

        <button
          onClick={onOpenNewProductModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs shadow-blue-600/20 active:scale-95 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <strong className="font-bold block text-amber-900">Alerta de Stock Bajo ({lowStockProducts.length} prendas)</strong>
              <span>Los siguientes productos han alcanzado o superado el stock mínimo sugerido: {lowStockProducts.map(p => p.name).join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU o Nombre del producto..."
            className="w-full bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
          />
        </div>

        <div className="relative w-full sm:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 px-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
          >
            <option value="all">Todas las Categorías</option>
            {categories.filter(c => c !== 'all').map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">SKU / Producto</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-right">Costo Unit. (S/)</th>
                <th className="py-3.5 px-4 text-right">Precio Venta (S/)</th>
                <th className="py-3.5 px-4 text-right">Margen Bruto</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => {
                  const profitUnit = prod.salePrice - prod.costPrice;
                  const marginPct = prod.salePrice > 0 ? (profitUnit / prod.salePrice) * 100 : 0;
                  const isLowStock = prod.stock <= prod.minStock;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-slate-400 font-bold block">{prod.sku}</span>
                        <p className="font-bold text-slate-900 text-xs">{prod.name}</p>
                        {prod.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{prod.notes}</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        S/ {prod.costPrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        S/ {prod.salePrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-amber-600 block font-mono">S/ {profitUnit.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">({marginPct.toFixed(1)}%)</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onUpdateStock(prod.id, Math.max(0, prod.stock - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                          >
                            -
                          </button>

                          <span
                            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full border ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-slate-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            {prod.stock} un.
                          </span>

                          <button
                            onClick={() => onUpdateStock(prod.id, prod.stock + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            title="Editar producto"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(prod.id)}
                            title="Eliminar producto"
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
                    No se encontraron productos en el inventario.
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
