import React, { useState } from 'react';
import { MetaAdExpense, Product, PricingCalculationRecord } from '../types';
import { X, Megaphone, Calculator, Package, Sparkles, Building2 } from 'lucide-react';

interface NewExpenseModalProps {
  products?: Product[];
  pricingRecords?: PricingCalculationRecord[];
  onClose: () => void;
  onSaveExpense: (expense: MetaAdExpense) => void;
  initialData?: Partial<MetaAdExpense>;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  products = [],
  pricingRecords = [],
  onClose,
  onSaveExpense,
  initialData,
}) => {
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [adAccount, setAdAccount] = useState(initialData?.adAccount || "D'RAYO (1334036197186369)");
  const [customAdAccount, setCustomAdAccount] = useState('');
  const [isCustomAccount, setIsCustomAccount] = useState(false);

  const [selectedSourceKey, setSelectedSourceKey] = useState<string>(() => {
    if (initialData?.productId) return `prod-${initialData.productId}`;
    if (initialData?.productName) return `custom-${initialData.productName}`;
    return '';
  });

  const [productName, setProductName] = useState(initialData?.productName || '');
  const [productId, setProductId] = useState(initialData?.productId || '');
  const [cpaTarget, setCpaTarget] = useState<number | undefined>(initialData?.cpaTarget);

  const [amount, setAmount] = useState<number | ''>(initialData?.amount || '');
  const [status, setStatus] = useState<'Pagado' | 'Fondos agregados'>(initialData?.status || 'Pagado');
  const [transactionId, setTransactionId] = useState(initialData?.transactionId || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Handle automatic selection from Calculator or Catalog
  const handleProductSelection = (key: string) => {
    setSelectedSourceKey(key);

    if (!key) {
      setProductName('');
      setProductId('');
      setCpaTarget(undefined);
      return;
    }

    if (key.startsWith('calc-')) {
      const calcId = key.replace('calc-', '');
      const calcRecord = pricingRecords.find((r) => r.id === calcId);
      if (calcRecord) {
        const title = calcRecord.title || calcRecord.comboTitle || calcRecord.productName || 'Oferta Calculadora';
        setProductName(title);
        setProductId(calcRecord.productId || calcRecord.id);
        setCpaTarget(calcRecord.cpa || undefined);
        if (!amount && calcRecord.cpa && calcRecord.cpa > 0) {
          // Suggest CPA as initial spend amount if blank
          setAmount(Number(calcRecord.cpa.toFixed(2)));
        }
      }
    } else if (key.startsWith('prod-')) {
      const pId = key.replace('prod-', '');
      const prod = products.find((p) => p.id === pId);
      if (prod) {
        setProductName(prod.name);
        setProductId(prod.id);
        setCpaTarget(undefined);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || Number(amount) <= 0) return;

    // Format DD/MM/YYYY
    let formattedDate = date;
    let monthKey = '';

    if (date.includes('-')) {
      const dateParts = date.split('-');
      formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      monthKey = `${dateParts[0]}-${dateParts[1]}`;
    } else {
      monthKey = new Date().toISOString().slice(0, 7);
    }

    const finalAccount = isCustomAccount && customAdAccount.trim() ? customAdAccount.trim() : adAccount;
    const txId = transactionId || `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newExpense: MetaAdExpense = {
      id: initialData?.id || `exp-${Date.now()}`,
      date: formattedDate,
      transactionId: txId,
      adAccount: finalAccount,
      productId: productId || undefined,
      productName: productName || undefined,
      cpaTarget: cpaTarget || undefined,
      amount: Number(amount),
      currency: 'PEN',
      status,
      paymentMethod: paymentMethod || undefined,
      period: 'Registro Manual',
      monthKey,
      notes: notes || undefined,
    };

    onSaveExpense(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            Registrar Gasto Publicitario Meta Ads
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Cuenta Publicitaria */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <label className="text-slate-800 font-bold flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Cuenta Publicitaria *
            </label>

            {!isCustomAccount ? (
              <div className="space-y-2">
                <select
                  value={adAccount}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomAccount(true);
                    } else {
                      setAdAccount(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-semibold cursor-pointer shadow-2xs"
                >
                  <option value="D'RAYO (1334036197186369)">D'RAYO (Cuenta Principal: 1334036197186369)</option>
                  <option value="D'RAYO Campañas 02 (89201948123)">D'RAYO Campañas 02 (Secundaria)</option>
                  <option value="D'RAYO Escalado TikTok / Meta">D'RAYO Escalado Ads</option>
                  <option value="__custom__">➕ Ingresar otra cuenta publicitaria...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej: D'RAYO Nueva Cuenta (ID: 981273918)"
                  value={customAdAccount}
                  onChange={(e) => setCustomAdAccount(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomAccount(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Volver a lista
                </button>
              </div>
            )}
          </div>

          {/* Producto / Oferta en Automático desde Calculadora o Catálogo */}
          <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <label className="text-blue-900 font-bold flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                Producto / Oferta (Automático de Calculadora)
              </label>
              {cpaTarget !== undefined && cpaTarget > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  CPA Objetivo: S/ {cpaTarget.toFixed(2)}
                </span>
              )}
            </div>

            <select
              value={selectedSourceKey}
              onChange={(e) => handleProductSelection(e.target.value)}
              className="w-full bg-white border border-blue-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-medium cursor-pointer shadow-2xs"
            >
              <option value="">-- Sin producto asignado (Gasto publicitario global) --</option>
              
              {/* Opciones desde la Calculadora de Precios */}
              {pricingRecords.length > 0 && (
                <optgroup label="🧮 Ofertas & Cálculos de la Calculadora">
                  {pricingRecords.map((rec) => {
                    const label = rec.title || rec.comboTitle || rec.productName || 'Cálculo sin título';
                    const cpaText = rec.cpa ? ` | CPA: S/ ${rec.cpa.toFixed(2)}` : '';
                    const priceText = rec.salePrice ? ` | Venta: S/ ${rec.salePrice.toFixed(2)}` : '';
                    return (
                      <option key={`calc-${rec.id}`} value={`calc-${rec.id}`}>
                        ⚡ {label} {priceText} {cpaText}
                      </option>
                    );
                  })}
                </optgroup>
              )}

              {/* Opciones desde el Catálogo de Productos */}
              {products.length > 0 && (
                <optgroup label="📦 Catálogo de Productos">
                  {products.map((prod) => (
                    <option key={`prod-${prod.id}`} value={`prod-${prod.id}`}>
                      {prod.name} (SKU: {prod.sku} | S/ {prod.salePrice.toFixed(2)})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {productName && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-600">Producto asociado:</span>
                <span className="font-bold text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {productName}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Fecha del Cargo *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Importe (S/ PEN) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-sm font-bold shadow-2xs text-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Estado del Pago *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="Pagado">Pagado (Cargo directo de anuncio facturado)</option>
              <option value="Fondos agregados">Fondos agregados (Recarga de saldo prepago)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">ID Transacción / Anuncio (Opcional)</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Ej: 26532361593121514..."
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-[11px] shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Método de Pago / Tarjeta (Opcional)</label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Ej: Visa .... 7916"
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Notas / Campaña (Opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Campaña Tráfico WhatsApp Oferta 2x1"
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Guardar Gasto Meta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
