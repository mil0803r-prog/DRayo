import React, { useState, useEffect } from 'react';
import { Sale, Product, SaleItem } from '../types';
import { generateMetaAdId, getDefaultAdIdForProduct } from '../lib/adUtils';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Truck,
  CreditCard,
  FileText,
  Tag,
  CheckCircle2
} from 'lucide-react';

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
  const [adId, setAdId] = useState(() => {
    const firstP = products[0];
    return firstP ? getDefaultAdIdForProduct(firstP.name) : generateMetaAdId();
  });
  const [city, setCity] = useState('Lima');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shippingCost, setShippingCost] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Yape');
  const [notes, setNotes] = useState('');

  // Items selected
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Initialize with first product if available
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      if (!adId) {
        setAdId(getDefaultAdIdForProduct(products[0].name));
      }
    }
  }, [products]);

  const handleAddItem = (productIdToAdd?: string, qtyToAdd?: number) => {
    const pId = productIdToAdd || selectedProductId;
    const qty = qtyToAdd !== undefined ? qtyToAdd : itemQuantity;
    if (!pId) return;

    const prod = products.find((p) => p.id === pId);
    if (!prod) return;

    // Check if already in list
    const existingIdx = selectedItems.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += qty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.salePrice,
          costPrice: prod.costPrice,
        },
      ]);
    }

    setItemQuantity(1);
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    const updated = [...selectedItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      setSelectedItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const numShipping = parseFloat(shippingCost) || 0;
  const subtotal = selectedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const total = subtotal + numShipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If no item explicitly added yet but user selected a product in dropdown, auto-add it!
    let itemsToSave = [...selectedItems];
    if (itemsToSave.length === 0) {
      const targetProd = products.find((p) => p.id === selectedProductId) || products[0];
      if (targetProd) {
        itemsToSave = [{
          productId: targetProd.id,
          productName: targetProd.name,
          quantity: itemQuantity || 1,
          unitPrice: targetProd.salePrice,
          costPrice: targetProd.costPrice,
        }];
      } else {
        itemsToSave = [{
          productId: 'prod-general',
          productName: 'Producto WhatsApp',
          quantity: 1,
          unitPrice: 59.0,
        }];
      }
    }

    const calculatedSubtotal = itemsToSave.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const calculatedTotal = calculatedSubtotal + numShipping;

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
      shippingCost: numShipping,
      total: calculatedTotal,
      paymentMethod,
      status: 'Confirmada',
      metaEventExported: false,
      notes: notes.trim() || undefined,
    };

    onSaveSale(newSale);
    onClose();
  };

  const selectedProductObj = products.find((p) => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Fixed Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Registrar Venta por WhatsApp
              </h3>
              <p className="text-xs text-slate-400">
                Datos del cliente, prendas del pedido y método de pago
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="new-sale-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Nombre del Cliente</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Carlos Mendoza"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl font-medium focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Teléfono WhatsApp</span>
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Ad ID, City & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-cyan-600" />
                <span>ID Anuncio</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-mono font-bold text-slate-400 select-none">
                  #
                </span>
                <input
                  type="text"
                  value={adId}
                  onChange={(e) => setAdId(e.target.value)}
                  placeholder="12028491038"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 pl-7 pr-3 py-2 rounded-xl font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Ciudad / Destino</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lima, Arequipa..."
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl font-semibold focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Email (Opcional)</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@gmail.com"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Add Product Section */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Prendas / Productos del Pedido</span>
              </label>
              {selectedProductObj && (
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  Stock: <strong className="text-slate-900">{selectedProductObj.stock} unids.</strong>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProductId(newId);
                  const prod = products.find((p) => p.id === newId);
                  if (prod) {
                    setAdId(getDefaultAdIdForProduct(prod.name));
                  }
                }}
                className="flex-1 bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-xs shadow-2xs cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.type === 'combo' ? '📦 [COMBO] ' : ''}{p.name} — S/ {p.salePrice.toFixed(2)}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-white border border-slate-300 rounded-xl px-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-9 text-center font-black font-mono text-slate-900 text-xs border-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setItemQuantity((q) => q + 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAddItem()}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>

            {/* Selected Items List */}
            {selectedItems.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                {selectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl text-xs border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 rounded-lg px-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, -1)}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-blue-600 font-mono px-1.5">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-slate-800 font-bold">{item.productName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-900 font-black">
                        S/ {(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method, Shipping & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                <span>Método de Pago</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-2.5 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-bold shadow-2xs cursor-pointer"
              >
                <option value="Yape">🟣 Yape</option>
                <option value="Plin">🔵 Plin</option>
                <option value="Transferencia Bancaria">🏦 Transferencia BCP/BBVA</option>
                <option value="Contra Entrega">📦 Pago Contra Entrega</option>
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Tarjeta">💳 Tarjeta de Crédito/Débito</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Costo Envío (S/)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">S/</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0.00"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Fecha de Venta</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-2.5 py-2 rounded-xl focus:outline-none font-mono font-bold shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Notas u Observaciones</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Entrega por Olva Courier, talla 30 color azul..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          {/* Total Summary Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 p-4 rounded-2xl border border-blue-200/80 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-slate-500 font-extrabold uppercase text-[10px] block tracking-wider">
                Total a Cobrar
              </span>
              <span className="text-xs text-slate-600">
                Subtotal: S/ {subtotal > 0 ? subtotal.toFixed(2) : (selectedProductObj?.salePrice || 59).toFixed(2)} + Envío: S/ {numShipping.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
                S/ {total > 0 ? total.toFixed(2) : ((selectedProductObj?.salePrice || 59) + numShipping).toFixed(2)} PEN
              </span>
            </div>
          </div>

        </form>

        {/* Fixed Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold cursor-pointer transition-colors shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-sale-form"
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/30 transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Guardar Venta</span>
          </button>
        </div>

      </div>
    </div>
  );
};
