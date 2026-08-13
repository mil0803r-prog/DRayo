import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, Settings, ShieldCheck } from 'lucide-react';
import { Product, Sale, MetaAdExpense, AISettings } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  products: Product[];
  sales: Sale[];
  metaExpenses: MetaAdExpense[];
  settings: AISettings;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  products,
  sales,
  metaExpenses,
  settings,
}) => {
  const assistantName = settings?.assistantName || "D'RAYO AI";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! Soy **${assistantName}**, tu asistente inteligente de negocio powered by Gemini (${settings?.model || 'gemini-3.6-flash'}). Puedo analizar tus ventas por WhatsApp, rentabilidad de prendas, métricas de Meta Ads y darte consejos para optimizar tu e-commerce. ¿En qué te ayudo hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Calculate live store context
  const totalSalesRevenue = sales
    .filter((s) => s.status !== 'Cancelada')
    .reduce((acc, s) => acc + s.total, 0);

  const totalMetaAdSpend = metaExpenses.reduce((acc, e) => acc + e.amount, 0);

  const totalCOGS = sales
    .filter((s) => s.status !== 'Cancelada')
    .reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    }, 0);

  const totalNetProfit = totalSalesRevenue - totalCOGS - totalMetaAdSpend;
  const roas = totalMetaAdSpend > 0 ? totalSalesRevenue / totalMetaAdSpend : 0;
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalOrders = sales.filter((s) => s.status !== 'Cancelada').length;

  const storeContext = `
  - Total Ventas Acumuladas: S/ ${totalSalesRevenue.toFixed(2)} PEN (${totalOrders} pedidos)
  - Gastos Meta Ads: S/ ${totalMetaAdSpend.toFixed(2)} PEN
  - Costo de Mercadería (COGS): S/ ${totalCOGS.toFixed(2)} PEN
  - Ganancia Neta Estimada: S/ ${totalNetProfit.toFixed(2)} PEN
  - ROAS de Meta Ads: ${roas.toFixed(2)}x
  - Productos con Stock Crítico/Bajo: ${lowStockProducts.length} (${lowStockProducts.map(p => `${p.name} [SKU: ${p.sku}, Stock: ${p.stock}]`).join(', ') || 'Ninguno'})
  - Total Productos en Catálogo: ${products.length}
  `;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send chat history, current store context, and settings to server route
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: storeContext,
          settings,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text || 'No pude obtener una respuesta en este momento.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Ocurrió un inconveniente**: ${err.message || 'No fue posible conectar con el servicio de IA.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `¡Chat reiniciado! ¿En qué más puedo ayudarte con la gestión de D'RAYO?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    { label: '📊 Resumen de mi ROAS y Ventas', text: 'Analiza mis métricas principales de ventas, gastos de publicidad Meta Ads y ROAS actual.' },
    { label: '📦 Productos en Stock Crítico', text: '¿Qué productos están en stock bajo y qué recomendación tienes para reponer?' },
    { label: '💡 Tips para Optimizar Ads en Meta', text: '¿Qué recomendaciones me das para mejorar el rendimiento de mis anuncios en Meta Ads y WhatsApp?' },
    { label: '💬 Estrategia de Cierre en WhatsApp', text: 'Dame 3 tips para convertir clientes indecisos en WhatsApp que preguntan por Yape/Plin.' },
  ];

  // Helper for rendering simple formatted text (bold, linebreaks)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Process bold syntax **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={line.startsWith('- ') || line.startsWith('* ') ? 'ml-3 list-disc' : 'mb-1.5 leading-relaxed'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg h-[92vh] max-h-[720px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide">{assistantName}</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {settings?.provider === 'openai' ? 'OpenAI' : 'Gemini'} ({settings?.model || '3.6 Flash'})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Asistente Virtual de Negocios & Meta Ads</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              title="Ajustes de IA & Gemini"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearChat}
              title="Reiniciar conversación"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Cerrar"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Metrics Bar Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-3 font-mono">
            <span>Ventas: <strong className="text-emerald-700">S/ {totalSalesRevenue.toFixed(0)}</strong></span>
            <span>Meta: <strong className="text-blue-700">S/ {totalMetaAdSpend.toFixed(0)}</strong></span>
            <span>ROAS: <strong className="text-amber-700">{roas.toFixed(1)}x</strong></span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Datos en vivo</span>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                <div className="text-xs">
                  {msg.role === 'assistant' ? renderFormattedText(msg.content) : msg.content}
                </div>
                <div
                  className={`text-[9px] mt-1.5 text-right font-mono ${
                    msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs rounded-tl-none flex items-center gap-2 text-slate-500">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Analizando datos y redactando respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(qp.text)}
              className="text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200/80 whitespace-nowrap transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe una consulta sobre ventas, ROAS, stock..."
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
