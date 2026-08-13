import React, { useState } from 'react';
import { Sale } from '../types';
import { Share2, Download, Copy, Check, FileSpreadsheet, Code, HelpCircle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

interface MetaExportViewProps {
  sales: Sale[];
  onMarkSalesAsExported: (saleIds: string[]) => void;
}

export const MetaExportView: React.FC<MetaExportViewProps> = ({
  sales,
  onMarkSalesAsExported,
}) => {
  const [exportFilter, setExportFilter] = useState<'all' | 'pending'>('pending');
  const [activeSubTab, setActiveSubTab] = useState<'csv' | 'json' | 'guide'>('csv');
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Filter sales based on tab choice
  const salesToExport = sales.filter((s) => {
    if (s.status === 'Cancelada') return false;
    if (exportFilter === 'pending') return !s.metaEventExported;
    return true;
  });

  // Helper to separate First & Last Name
  const parseName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    const fn = parts[0] || '';
    const ln = parts.slice(1).join(' ') || parts[0] || '';
    return { fn, ln };
  };

  // Helper to format phone for Meta
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 9) return `51${digits}`; // Add Peru prefix
    return digits;
  };

  // Format Unix timestamp
  const getUnixTimestamp = (dateStr: string, timeStr?: string) => {
    const time = timeStr || '12:00';
    const dateTime = new Date(`${dateStr}T${time}:00`);
    return Math.floor(dateTime.getTime() / 1000);
  };

  // Build CSV string
  const generateCSVData = () => {
    const headers = [
      'event_name',
      'event_time',
      'value',
      'currency',
      'phone',
      'email',
      'fn',
      'ln',
      'city',
      'order_id',
      'custom_data_contents'
    ];

    const rows = salesToExport.map((s) => {
      const { fn, ln } = parseName(s.customerName);
      const phone = formatPhone(s.customerPhone);
      const email = s.customerEmail || '';
      const timestamp = getUnixTimestamp(s.date, s.time);
      const itemsList = s.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ');

      return [
        'Purchase',
        timestamp,
        s.total.toFixed(2),
        'PEN',
        phone,
        email,
        fn,
        ln,
        s.city || 'Lima',
        s.id,
        `"${itemsList}"`
      ];
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  // Build JSON Payload for CAPI
  const generateJSONPayload = () => {
    const payload = {
      data: salesToExport.map((s) => {
        const { fn, ln } = parseName(s.customerName);
        return {
          event_name: 'Purchase',
          event_time: getUnixTimestamp(s.date, s.time),
          action_source: 'physical_store',
          user_data: {
            ph: [formatPhone(s.customerPhone)],
            em: s.customerEmail ? [s.customerEmail] : [],
            fn: [fn.toLowerCase()],
            ln: [ln.toLowerCase()],
            ct: [s.city ? s.city.toLowerCase() : 'lima']
          },
          custom_data: {
            currency: 'PEN',
            value: s.total,
            order_id: s.id,
            contents: s.items.map((i) => ({
              id: i.productId,
              quantity: i.quantity,
              item_price: i.unitPrice
            }))
          }
        };
      })
    };

    return JSON.stringify(payload, null, 2);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSVData();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meta_offline_events_drayo_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Mark as exported automatically
    onMarkSalesAsExported(salesToExport.map((s) => s.id));
  };

  const handleCopyCSV = () => {
    navigator.clipboard.writeText(generateCSVData());
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2000);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(generateJSONPayload());
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200/80 rounded-xl">
                <Share2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Automatización & Exportación a Meta Ads</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Conecta tus ventas de WhatsApp con el <strong className="text-slate-800 font-semibold">Administrador de Eventos de Meta (Facebook & Instagram Ads)</strong> para medir ROAS real y optimizar tus anuncios.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                exportFilter === 'pending'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({sales.filter((s) => !s.metaEventExported && s.status !== 'Cancelada').length})
            </button>
            <button
              onClick={() => setExportFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                exportFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas las ventas ({sales.filter((s) => s.status !== 'Cancelada').length})
            </button>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-5 pt-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('csv')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'csv'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Generador CSV Meta Offline Events</span>
          </button>

          <button
            onClick={() => setActiveSubTab('json')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'json'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <Code className="w-4 h-4 text-white" />
            <span>Payload JSON (Conversion API)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'guide'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-white" />
            <span>Guía de Carga en Meta Manager</span>
          </button>
        </div>
      </div>

      {/* CSV Generator Subtab */}
      {activeSubTab === 'csv' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Listado de Eventos "Purchase" para Meta</span>
                  <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {salesToExport.length} ventas listas
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formato nativo estandarizado de Meta Ads Manager para atribución offline por teléfono WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCSV}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {copiedCSV ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copiedCSV ? 'Copiado!' : 'Copiar CSV'}</span>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  disabled={salesToExport.length === 0}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Descargar Archivo CSV</span>
                </button>
              </div>
            </div>

            {/* CSV Preview Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] text-slate-700 font-mono">
                  <thead className="bg-slate-100 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">event_name</th>
                      <th className="py-2.5 px-3">event_time</th>
                      <th className="py-2.5 px-3 text-right">value</th>
                      <th className="py-2.5 px-3">currency</th>
                      <th className="py-2.5 px-3">phone</th>
                      <th className="py-2.5 px-3">fn / ln</th>
                      <th className="py-2.5 px-3">city</th>
                      <th className="py-2.5 px-3">order_id</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {salesToExport.length > 0 ? (
                      salesToExport.map((s) => {
                        const { fn, ln } = parseName(s.customerName);
                        return (
                          <tr key={s.id} className="hover:bg-slate-100/60">
                            <td className="py-2.5 px-3 text-emerald-700 font-bold">Purchase</td>
                            <td className="py-2.5 px-3 text-slate-500">{getUnixTimestamp(s.date, s.time)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">S/ {s.total.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-slate-500">PEN</td>
                            <td className="py-2.5 px-3 text-amber-700 font-semibold">{formatPhone(s.customerPhone)}</td>
                            <td className="py-2.5 px-3 text-slate-800">{fn} {ln}</td>
                            <td className="py-2.5 px-3 text-slate-500">{s.city || 'Lima'}</td>
                            <td className="py-2.5 px-3 text-blue-600 font-bold">{s.id}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                          No hay ventas pendientes para exportar. ¡Todas tus ventas están sincronizadas con Meta!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Payload Subtab */}
      {activeSubTab === 'json' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Meta Conversions API (CAPI) JSON Payload</h3>
              <p className="text-xs text-slate-500">Formato apto para enviar vía webhook, Zapier o integración directa HTTP POST.</p>
            </div>

            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedJSON ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedJSON ? '¡JSON Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>

          <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
            {generateJSONPayload()}
          </pre>
        </div>
      )}

      {/* Guide Subtab */}
      {activeSubTab === 'guide' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              Pasos para subir el archivo CSV a Meta Business Manager
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sigue estas instrucciones para subir tus ventas de WhatsApp a Facebook Ads Manager y optimizar tus campañas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">Descarga el CSV</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Haz clic en <strong>"Descargar Archivo CSV"</strong> en la pestaña anterior para generar el archivo <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">meta_offline_events_drayo.csv</code> con los teléfonos de WhatsApp y ventas.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">Abre Meta Business Manager</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ve a <strong>Administrador de Eventos de Meta</strong> &gt; Selecciona tu Píxel o Conjunto de Eventos Offline &gt; Haz clic en <strong>"Cargar Eventos Offline"</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">Sube & Mapea</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sube el archivo CSV. Meta vinculará automáticamente las columnas (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">phone</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">value</code>, <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">currency</code>) con tus anuncios activos en Instagram/Facebook.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
