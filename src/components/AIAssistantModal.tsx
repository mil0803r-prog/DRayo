import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  Settings,
  ShieldCheck,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Square,
  Play
} from 'lucide-react';
import { Product, Sale, MetaAdExpense, AISettings } from '../types';
import { speakText, stopSpeaking, startSpeechRecognition } from '../lib/voice';

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
  const assistantName = "Asesor IA D'RAYO";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! Soy tu **Asesor IA D'RAYO**. ¿En qué puedo asesorarte hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(settings?.enableVoiceResponse ?? true);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void; abort?: () => void } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    } else {
      stopSpeaking();
      setSpeakingMessageId(null);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [messages, isOpen]);

  // Clean up speech when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

  const handleSpeak = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(messageId);
    speakText(text, {
      speed: settings?.voiceSpeed ?? 1.0,
      pitch: settings?.voicePitch ?? 1.0,
      voiceName: settings?.voiceName,
      onStart: () => setSpeakingMessageId(messageId),
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const handleStopAllAudio = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
  };

  const handleToggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Stop speaking if playing
    stopSpeaking();
    setSpeakingMessageId(null);

    // Request audio stream permission if needed
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr) {
      console.warn('Microphone permission request note:', permErr);
    }

    const rec = startSpeechRecognition(
      (transcript) => {
        setSpeechTranscript(transcript);
        setInput(transcript);
      },
      (err) => {
        console.warn('Mic speech error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (rec) {
      recognitionRef.current = rec;
      setIsListening(true);
      setSpeechTranscript('');
    } else {
      alert('Tu navegador no tiene activado el reconocimiento de voz por micrófono (Web Speech API). Puedes continuar escribiendo tus consultas.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Stop any ongoing speech
    stopSpeaking();
    setSpeakingMessageId(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setSpeechTranscript('');
    setIsLoading(true);

    try {
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

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantText = data.text || 'No pude obtener una respuesta en este momento.';

      const assistantMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If voice response is enabled, speak it automatically
      if (isVoiceEnabled) {
        handleSpeak(assistantMsgId, assistantText);
      }
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
    stopSpeaking();
    setSpeakingMessageId(null);
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

  // Helper for rendering PRO formatted paragraphs and highlighted numbers
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Check if it is a heading (### or ## or #)
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-extrabold text-slate-900 text-xs mt-3 mb-1.5 flex items-center gap-1.5 text-blue-900">
            <span className="w-1.5 h-3.5 bg-blue-600 rounded-full inline-block"></span>
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        return (
          <h3 key={idx} className="font-black text-slate-900 text-sm mt-3.5 mb-1.5 pb-1 border-b border-slate-200/80 text-indigo-950">
            {trimmed.replace(/^#{1,2}\s*/, '')}
          </h3>
        );
      }

      // Callouts / Key takeaways (e.g. lines starting with 💡, 📊, 💰, ⚠️, 🚀, > )
      if (trimmed.startsWith('💡') || trimmed.startsWith('📊') || trimmed.startsWith('💰') || trimmed.startsWith('⚠️') || trimmed.startsWith('🚀') || trimmed.startsWith('>')) {
        const cleanContent = trimmed.startsWith('>') ? trimmed.slice(1).trim() : trimmed;
        return (
          <div key={idx} className="my-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/80 text-slate-800 text-[11px] leading-relaxed shadow-2xs">
            {renderInlineProTokens(cleanContent)}
          </div>
        );
      }

      // Bullet points
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
      const isNumbered = /^\d+\.\s/.test(trimmed);

      if (isBullet || isNumbered) {
        const bulletText = isBullet ? trimmed.replace(/^[-*•]\s*/, '') : trimmed.replace(/^\d+\.\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 ml-1 text-slate-800 leading-relaxed text-xs">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
            <div className="flex-1">
              {renderInlineProTokens(bulletText)}
            </div>
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={idx} className="mb-2 leading-relaxed text-slate-700 text-xs">
          {renderInlineProTokens(line)}
        </p>
      );
    });
  };

  // Helper to parse bold, currency (S/ XXX), ROAS (X.Xx), percentages (XX%), and numeric metrics
  const renderInlineProTokens = (text: string) => {
    // Regex matches:
    // 1. **bold text**
    // 2. Currency: S/\.?\s?[0-9,]+(\.[0-9]{1,2})?
    // 3. ROAS: [0-9.]+\s?[xX](\s?ROAS)?
    // 4. Percentage: [0-9.]+%
    const tokenRegex = /(\*\*.*?\*\*|S\/\.?\s*\d+(?:,\d{3})*(?:\.\d{1,2})?|\b\d+(?:\.\d+)?x(?:\s*ROAS)?|\b\d+(?:\.\d+)?%)/gi;

    const parts = text.split(tokenRegex);

    return parts.map((part, pIdx) => {
      if (!part) return null;

      // Bold text: **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={pIdx} className="font-extrabold text-slate-900 mx-0.5">
            {inner}
          </strong>
        );
      }

      // Currency in Soles: S/ 1,250.00
      if (/^S\/\.?\s*\d+/i.test(part)) {
        return (
          <span
            key={pIdx}
            className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-1.5 py-0.5 rounded-md text-[11px] inline-flex items-center gap-0.5 shadow-2xs mx-0.5"
          >
            {part}
          </span>
        );
      }

      // ROAS metric: e.g. 3.45x or 3.45x ROAS
      if (/^\d+(?:\.\d+)?x(?:\s*ROAS)?$/i.test(part)) {
        return (
          <span
            key={pIdx}
            className="font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200/90 px-1.5 py-0.5 rounded-md text-[11px] inline-flex items-center gap-0.5 shadow-2xs mx-0.5"
          >
            {part}
          </span>
        );
      }

      // Percentage: e.g. 35.5%
      if (/^\d+(?:\.\d+)?%$/.test(part)) {
        return (
          <span
            key={pIdx}
            className="font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200/90 px-1.5 py-0.5 rounded-md text-[11px] inline-flex items-center gap-0.5 shadow-2xs mx-0.5"
          >
            {part}
          </span>
        );
      }

      return <span key={pIdx}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg h-[92vh] max-h-[740px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">Asesor IA D'RAYO</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSettings}
              title="Ajustes de IA"
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

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isSpeakingThis = speakingMessageId === msg.id;
            return (
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
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs relative ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <div className="text-xs">
                    {msg.role === 'assistant' ? renderFormattedText(msg.content) : msg.content}
                  </div>

                  <div className="text-[9px] mt-1.5 text-right font-mono text-slate-400">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs rounded-tl-none flex items-center gap-2 text-slate-500">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Analizando consulta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Listening Live Overlay Bar */}
        {isListening && (
          <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold animate-pulse border-t border-red-600">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 animate-bounce" />
              <span>Escuchando... Di tu pregunta</span>
            </div>
            <button
              onClick={handleToggleListening}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-[10px] cursor-pointer"
            >
              Detener
            </button>
          </div>
        )}

        {/* Input Bar with Mic & Send */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          {/* Microphone button */}
          <button
            type="button"
            onClick={handleToggleListening}
            title={isListening ? 'Detener grabación de voz' : 'Hablar por micrófono'}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/30 ring-2 ring-red-300'
                : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200/80'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe o habla por micrófono...'}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
