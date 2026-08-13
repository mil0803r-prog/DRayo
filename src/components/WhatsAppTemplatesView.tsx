import React, { useState } from 'react';
import { WhatsAppTemplate } from '../types';
import { FileText, Copy, Check, Plus, MessageSquare, Tag, Send, Sparkles, RefreshCw, Bot } from 'lucide-react';

interface WhatsAppTemplatesViewProps {
  templates: WhatsAppTemplate[];
  onAddTemplate: (template: WhatsAppTemplate) => void;
}

export const WhatsAppTemplatesView: React.FC<WhatsAppTemplatesViewProps> = ({
  templates,
  onAddTemplate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // New template state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WhatsAppTemplate['category']>('Bienvenida');
  const [text, setText] = useState('');

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<WhatsAppTemplate['category']>('Pago Yape/Plin');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Replacer state
  const [vars, setVars] = useState({
    NRO_PEDIDO: 'VEN-2026-085',
    TOTAL: '134.00',
    PRODUCTOS: '• 1x Polera Oversize D\'RAYO Heavyweight',
    COURIER: 'Shalom Agencia',
    RASTREO: 'SHL-9876543'
  });

  const replaceVariables = (str: string) => {
    return str
      .replace(/\{NRO_PEDIDO\}/g, vars.NRO_PEDIDO)
      .replace(/\{TOTAL\}/g, vars.TOTAL)
      .replace(/\{PRODUCTOS\}/g, vars.PRODUCTOS)
      .replace(/\{COURIER\}/g, vars.COURIER)
      .replace(/\{RASTREO\}/g, vars.RASTREO);
  };

  const handleCopy = (id: string, rawText: string) => {
    const finalMsg = replaceVariables(rawText);
    navigator.clipboard.writeText(finalMsg);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !text) return;

    const newT: WhatsAppTemplate = {
      id: `t-${Date.now()}`,
      title,
      category,
      text
    };

    onAddTemplate(newT);
    setTitle('');
    setText('');
    setShowAddModal(false);
  };

  const handleGenerateAiTemplate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim() || isGenerating) return;

    setIsGenerating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Genera una plantilla profesional de respuesta rápida para WhatsApp de la tienda de ropa D'RAYO.
Categoría deseada: "${aiCategory}".
Requerimiento específico: "${promptToUse}".

REGLAS OBLIGATORIAS:
- Incluye variables entre llaves cuando aplique: {NRO_PEDIDO}, {TOTAL}, {PRODUCTOS}, {COURIER}, {RASTREO}.
- Utiliza emojis apropiados para WhatsApp y saltos de línea amigables.
- Responde estricta y únicamente en formato JSON con la siguiente estructura exacta:
{
  "title": "Título corto y claro",
  "category": "${aiCategory}",
  "text": "Texto completo del mensaje con emojis y variables"
}`,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al comunicarse con Gemini AI');

      // Parse JSON from response text
      const cleanJson = (data.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.title && parsed.text) {
        setTitle(parsed.title);
        setCategory(parsed.category || aiCategory);
        setText(parsed.text);
        setShowAiModal(false);
        setShowAddModal(true); // Open standard modal populated with Gemini generated text
      } else {
        throw new Error('Formato de plantilla no válido generado por la IA.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'No se pudo generar la plantilla. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Plantillas de Respuestas Rápida para WhatsApp</span>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              {templates.length} Plantillas
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Responde de inmediato a tus clientes en WhatsApp con mensajes profesionales para cobros Yape/Plin, confirmaciones y códigos de seguimiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs text-xs sm:text-sm whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Generar con IA</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs text-xs sm:text-sm whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Plantilla</span>
          </button>
        </div>
      </div>

      {/* Dynamic Variable Customizer Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" />
          <span>Variables dinámicas de prueba para copiar</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Nº Pedido</label>
            <input
              type="text"
              value={vars.NRO_PEDIDO}
              onChange={(e) => setVars({ ...vars, NRO_PEDIDO: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Total (S/)</label>
            <input
              type="text"
              value={vars.TOTAL}
              onChange={(e) => setVars({ ...vars, TOTAL: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Courier / Agencia</label>
            <input
              type="text"
              value={vars.COURIER}
              onChange={(e) => setVars({ ...vars, COURIER: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Código Rastreo</label>
            <input
              type="text"
              value={vars.RASTREO}
              onChange={(e) => setVars({ ...vars, RASTREO: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl) => {
          const finalMessage = replaceVariables(tpl.text);
          const isCopied = copiedId === tpl.id;

          return (
            <div key={tpl.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    {tpl.title}
                  </span>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    {tpl.category}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                  {finalMessage}
                </div>
              </div>

              <button
                onClick={() => handleCopy(tpl.id, tpl.text)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
              >
                {isCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                <span>{isCopied ? '¡Plantilla Copiada al Portapapeles!' : 'Copiar Mensaje para WhatsApp'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Crear Nueva Plantilla</h3>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Título de la Plantilla</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Saludo de Bienvenida"
                  className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="Bienvenida">Bienvenida</option>
                  <option value="Confirmación">Confirmación</option>
                  <option value="Pago Yape/Plin">Pago Yape/Plin</option>
                  <option value="Envío">Envío</option>
                  <option value="Seguimiento">Seguimiento</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Texto del Mensaje (puedes usar {'{NRO_PEDIDO}'}, {'{TOTAL}'}, {'{PRODUCTOS}'}, {'{COURIER}'})
                </label>
                <textarea
                  required
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="¡Hola! Tu pedido {NRO_PEDIDO} ha sido procesado por un total de S/ {TOTAL}..."
                  className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Template Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-xl shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Generar Plantilla con IA</h3>
                <p className="text-xs text-slate-500">Crea mensajes persuasivos para WhatsApp adaptados a tu tienda D'RAYO</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Categoría de Mensaje</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs font-medium"
                >
                  <option value="Bienvenida">Bienvenida a la tienda</option>
                  <option value="Pago Yape/Plin">Cobro Yape / Plin con QR</option>
                  <option value="Confirmación">Confirmación de pedido y talla</option>
                  <option value="Envío">Aviso de despacho y courier (Shalom/Olva)</option>
                  <option value="Seguimiento">Seguimiento a cliente indeciso</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">¿Qué deseas transmitir en la plantilla?</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ej: Mensaje amable recordando la cuenta BCP/Yape de D'RAYO e incentivando el pago ofreciendo un sticker gratis en su compra..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
                />
              </div>

              {/* Quick Prompt Ideas */}
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Ideas Rápidas</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Recordatorio amable para pago Yape/Plin',
                    'Aviso de código de rastreo Shalom con agencia',
                    'Ofrecer 10% de descuento en la 2da prenda',
                    'Confirmar dirección y referencia de entrega',
                  ].map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(idea);
                        handleGenerateAiTemplate(idea);
                      }}
                      disabled={isGenerating}
                      className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-medium">
                  {aiError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 font-medium cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateAiTemplate()}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Generando con Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generar Plantilla</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
