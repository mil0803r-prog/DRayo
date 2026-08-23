import React from 'react';
import { X, Download, Tag, Calendar, ShoppingBag, DollarSign, Zap, MapPin } from 'lucide-react';
import { DailySaleRecord } from '../../types';

interface ImageLightboxModalProps {
  record: DailySaleRecord | null;
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  record,
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate text-white">
                {record?.defaultProduct || 'Creativo / Anuncio'}
              </h3>
              <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-600/30 text-blue-200 border border-blue-500/40 text-xs sm:text-sm font-mono font-black">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>{record?.date || 'En vivo'}</span>
                </span>
                {record?.month && (
                  <span className="text-xs font-bold text-slate-300 uppercase">
                    ({record.month})
                  </span>
                )}
                {record?.adId && (
                  <span className="text-xs text-slate-300 font-mono">
                    ID: <strong className="text-cyan-400 font-bold">#{record.adId}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={`creativo-${record?.adId || 'ad'}-${record?.date || 'date'}.jpg`}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Descargar imagen"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-600 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Display */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-[300px]">
          <img
            src={imageUrl}
            alt="Creativo de Anuncio"
            className="max-h-[62vh] max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Bottom Metrics Details Bar */}
        {record && (
          <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-white text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Ventas Registradas</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {record.salesCount} ventas
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Gasto Diario</span>
              <span className="text-base font-black text-amber-400 font-mono">
                S/ {record.dailySpend.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">CPA Real</span>
              <span className="text-base font-black text-cyan-400 font-mono">
                S/ {record.cpa.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Plataforma</span>
              <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">
                {record.platform || 'Meta Ads'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
