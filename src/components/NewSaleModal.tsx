import React, { useState } from 'react';
import { Sale, Product, SaleItem } from '../types';
import { X, Plus, Trash2, ShoppingBag, DollarSign } from 'lucide-react';

interface NewSaleModalProps {
  products: Product[];
  onClose: () => void;
  onSaveSale: (sale: Sale) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  products,
  onClose,
  onSaveSale,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+51 ');
  const [customerEmail, setCustomerEmail] = useState('');
  const [adId, setAdId] = useState('');
  const [city, setCity] = useState('Lima');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shippingCost, setShippingCost] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Yape');
  const [notes, setNotes] = useState('');

  // Items selected
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in list
    const existingIdx = selectedItems.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += itemQuantity;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: itemQuantity,
          unitPrice: prod.salePrice,
          costPrice: prod.costPrice,
        },
      ]);
    }

    setSelectedProductId('');
    setItemQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const subtotal = selectedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const total = subtotal + Number(shippingCost);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If no item explicitly added yet, auto-add default product or a generic item
    let itemsToSave = [...selectedItems];
    if (itemsToSave.length === 0) {
      if (products.length > 0) {
        itemsToSave = [{
          productId: products[0].id,
          productName: products[0].name,
          quantity: 1,
          unitPrice: products[0].salePrice,
        }];
      } else {
        itemsToSave = [{
          productId: 'prod-general',
          productName: 'Producto WhatsApp',
          quantity: 1,
          unitPrice: 50.0,
        }];
      }
    }

    const calculatedSubtotal = itemsToSave.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const calculatedTotal = calculatedSubtotal + Number(shippingCost || 0);

    const newSale: Sale = {
      id: `VEN-2026-${Math.floor(100 + Math.random() * 900)}`,
      adId: adId.trim() || undefined,
      customerName: customerName.trim() || 'Cliente WhatsApp',
      customerPhone: customerPhone.trim() || '+51 900 000 000',
      customerEmail: customerEmail.trim() || undefined,
      city: city.trim() || 'Lima',
      date: date || new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      items: itemsToSave,
      subtotal: calculatedSubtotal,
      shippingCost: Number(shippingCost || 0),
      total: calculatedTotal,
      paymentMethod,
      status: 'Confirmada',
      metaEventExported: false,
      notes: notes.trim() || undefined,
    };

    onSaveSale(newSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl my-8">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            Registrar Nueva Venta WhatsApp
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Nombre del Cliente</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Carlos Mendoza (opcional)"
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Teléfono WhatsApp</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+51 987654321 (opcional)"
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">ID Anuncio (Meta/TikTok)</label>
              <input
                type="text"
                value={adId}
                onChange={(e) => setAdId(e.target.value)}
                placeholder="Ej: 238541298..."
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Email (Opcional Meta)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@gmail.com"
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Ciudad de Envío</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lima, Arequipa..."
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Add Product Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="text-slate-800 font-semibold block text-xs">Agregar Producto al Pedido</label>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 text-xs shadow-2xs cursor-pointer"
              >
                <option value="">Selecciona prenda del inventario...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — S/ {p.salePrice.toFixed(2)} (Stock: {p.stock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-white border border-slate-200 text-slate-900 px-2 py-1.5 rounded-lg text-center font-bold shadow-2xs"
              />

              <button
                type="button"
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Selected Items List */}
            {selectedItems.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg text-xs border border-slate-200/80">
                    <div>
                      <span className="font-bold text-blue-600">{item.quantity}x</span>{' '}
                      <span className="text-slate-800 font-medium">{item.productName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-700 font-semibold">S/ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No has agregado productos aún</p>
            )}
          </div>

          {/* Payment Method, Date, Shipping */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Método Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-white border border-slate-200 text-slate-900 px-2.5 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
                <option value="Transferencia Bancaria">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Costo Envío (S/)</label>
              <input
                type="number"
                placeholder="0.00"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 px-2.5 py-2 rounded-xl focus:outline-none font-mono text-[11px] shadow-2xs"
              />
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-bold uppercase text-[11px]">Total Venta:</span>
            <span className="text-xl font-extrabold text-blue-600 font-mono">S/ {total.toFixed(2)} PEN</span>
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
              Guardar Venta
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
