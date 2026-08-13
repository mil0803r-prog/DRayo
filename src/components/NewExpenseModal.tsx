import React, { useState } from 'react';
import { MetaAdExpense } from '../types';
import { X, Megaphone, DollarSign } from 'lucide-react';

interface NewExpenseModalProps {
  onClose: () => void;
  onSaveExpense: (expense: MetaAdExpense) => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  onClose,
  onSaveExpense,
}) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState<number>(20);
  const [status, setStatus] = useState<'Pagado' | 'Fondos agregados'>('Pagado');
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    // Format DD/MM/YYYY
    const dateParts = date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    const monthKey = `${dateParts[0]}-${dateParts[1]}`;

    const txId = transactionId || `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newExpense: MetaAdExpense = {
      id: `exp-${Date.now()}`,
      date: formattedDate,
      transactionId: txId,
      amount: Number(amount),
      currency: 'PEN',
      status,
      paymentMethod: paymentMethod || undefined,
      period: 'Registro Manual',
      monthKey,
    };

    onSaveExpense(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
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
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-sm font-bold shadow-2xs"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Estado del Pago *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="Pagado">Pagado (Cargo directo de anuncio)</option>
              <option value="Fondos agregados">Fondos agregados (Recarga de saldo)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Identificador de Transacción (Opcional)</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Ej: 26532361593121514-28049604..."
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
              Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
