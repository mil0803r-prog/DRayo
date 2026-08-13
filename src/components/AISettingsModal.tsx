import React, { useState } from 'react';
import { Settings, X, Sparkles, Key, Cpu, Sliders, CheckCircle2, AlertTriangle, RefreshCw, Zap, Check, Bot, ExternalLink } from 'lucide-react';
import { AISettings } from '../types';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (newSettings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [provider, setProvider] = useState<'gemini' | 'openai'>(settings.provider || 'gemini');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState<string>(
    settings.model || (settings.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.6-flash')
  );
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);
  const [assistantName, setAssistantName] = useState(settings.assistantName || "D'RAYO AI");
  const [systemInstruction, setSystemInstruction] = useState(
    settings.systemInstruction ||
      `Eres "${assistantName}", el asistente inteligente oficial de la marca D'RAYO (E-commerce de moda/ropa en Perú). Tu función es brindar asesoramiento estratégico de negocio, análisis financiero, cálculo de ROAS de Meta Ads, optimización de ventas por WhatsApp y gestión de inventarios.`
  );
  const [enableWhatsAppSuggestions, setEnableWhatsAppSuggestions] = useState(settings.enableWhatsAppSuggestions ?? true);
  const [enableStockAlerts, setEnableStockAlerts] = useState(settings.enableStockAlerts ?? true);
  const [enableROASAnalysis, setEnableROASAnalysis] = useState(settings.enableROASAnalysis ?? true);

  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
    latencyMs?: number;
    modelUsed?: string;
  }>({ status: 'idle' });

  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setProvider(newProvider);
    if (newProvider === 'openai') {
      setModel('gpt-4o-mini');
    } else {
      setModel('gemini-3.6-flash');
    }
    setTestResult({ status: 'idle' });
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing' });
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim() || undefined,
          model,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setTestResult({
          status: 'success',
          message: data.message || `Conexión exitosa con ${provider === 'openai' ? 'OpenAI' : 'Google Gemini'}`,
          latencyMs: data.latencyMs,
          modelUsed: data.modelUsed,
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.error || `No se pudo conectar con ${provider === 'openai' ? 'OpenAI' : 'Google Gemini'}.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Error de red al probar conexión.',
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      provider,
      apiKey: apiKey.trim() || undefined,
      model,
      temperature,
      assistantName: assistantName.trim() || "D'RAYO AI",
      systemInstruction,
      enableWhatsAppSuggestions,
      enableStockAlerts,
      enableROASAnalysis,
    });
    onClose();
  };

  const geminiModels = [
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', tag: 'Recomendado', desc: 'Ultra rápido y preciso' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Velocidad', desc: 'Respuesta balanceada' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Avanzado', desc: 'Razonamiento profundo' },
  ];

  const openAiModels = [
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', tag: 'Económico', desc: 'Respuesta veloz e inteligente' },
    { id: 'gpt-4o', name: 'GPT-4o (Omni)', tag: 'Máxima Potencia', desc: 'Razonamiento superior' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', tag: 'Clásico', desc: 'Rápido y eficiente' },
  ];

  const currentModels = provider === 'openai' ? openAiModels : geminiModels;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ajustes de IA (Gemini / OpenAI)</h3>
              <p className="text-xs text-slate-500">Configura proveedores, modelos, claves de API y límites de generación</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          
          {/* AI Provider Switcher */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-slate-800 font-bold block flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Proveedor de Inteligencia Artificial</span>
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  provider === 'gemini'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-semibold'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${provider === 'gemini' ? 'text-amber-300' : 'text-blue-600'}`} />
                <div className="text-left">
                  <span className="block text-xs">Google Gemini</span>
                  <span className={`text-[10px] ${provider === 'gemini' ? 'text-blue-100' : 'text-slate-400'}`}>3.6 Flash / Pro</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  provider === 'openai'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-semibold'
                }`}
              >
                <Cpu className={`w-5 h-5 ${provider === 'openai' ? 'text-emerald-200' : 'text-emerald-600'}`} />
                <div className="text-left">
                  <span className="block text-xs">OpenAI</span>
                  <span className={`text-[10px] ${provider === 'openai' ? 'text-emerald-100' : 'text-slate-400'}`}>GPT-4o / GPT-4o mini</span>
                </div>
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <label className="text-slate-800 font-bold block flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Modelo de {provider === 'openai' ? 'OpenAI' : 'Google Gemini'}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {currentModels.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    model === m.id
                      ? 'bg-blue-50/80 border-blue-500 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{m.name}</span>
                      {model === m.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block">{m.desc}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 self-start ${
                    model === m.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Configuration */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold block flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Clave API de {provider === 'openai' ? 'OpenAI' : 'Google Gemini'}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {showKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {provider === 'openai' ? (
                <>
                  Ingresa tu clave de API de OpenAI (comienza con <code className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-emerald-700 font-mono text-[10px]">sk-...</code>). Si no tienes una, créala en{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-blue-600 underline font-semibold hover:text-blue-800"
                  >
                    OpenAI API Keys <ExternalLink className="w-3 h-3" />
                  </a>.
                </>
              ) : (
                <>
                  Por defecto el servidor utiliza la clave preconfigurada. Puedes ingresar tu propia clave en{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-blue-600 underline font-semibold hover:text-blue-800"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>.
                </>
              )}
            </p>
            
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-proj-...' : 'AIzaSy...'}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-mono shadow-2xs text-xs"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult.status === 'testing'}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {testResult.status === 'testing' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Probar</span>
              </button>
            </div>

            {/* Test Result Feedback */}
            {testResult.status === 'success' && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-[11px]">{testResult.message}</span>
                </div>
                {testResult.latencyMs && (
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {testResult.latencyMs} ms
                  </span>
                )}
              </div>
            )}

            {testResult.status === 'error' && (
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium text-[11px]">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Temperature / Creativity Slider */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold block flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Temperatura / Creatividad de Respuestas</span>
              </label>
              <span className="font-mono font-bold bg-white px-2.5 py-0.5 border border-slate-200 rounded-lg text-slate-800">
                {temperature.toFixed(1)}
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0.0 (Más preciso)</span>
              <span>0.5 (Balanceado)</span>
              <span>1.0 (Muy creativo)</span>
            </div>
          </div>

          {/* Custom Assistant Name & System Prompt */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Nombre del Asistente Virtual</label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder="Ej: D'RAYO AI..."
                className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-bold shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Instrucciones del Sistema (System Prompt)
              </label>
              <textarea
                rows={3}
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="Escribe las instrucciones de personalidad..."
                className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs leading-relaxed shadow-2xs"
              />
            </div>
          </div>

          {/* AI Feature Toggles */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="text-slate-800 font-bold block mb-1">Módulos Inteligentes Habilitados</label>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded-lg border border-slate-200/80">
                <span className="text-slate-700 font-medium">Auto-sugerencias de mensajes para WhatsApp</span>
                <input
                  type="checkbox"
                  checked={enableWhatsAppSuggestions}
                  onChange={(e) => setEnableWhatsAppSuggestions(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded-lg border border-slate-200/80">
                <span className="text-slate-700 font-medium">Alertas de Stock Crítico en Inventario</span>
                <input
                  type="checkbox"
                  checked={enableStockAlerts}
                  onChange={(e) => setEnableStockAlerts(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 bg-white rounded-lg border border-slate-200/80">
                <span className="text-slate-700 font-medium">Diagnósticos de ROAS y métricas de Meta Ads</span>
                <input
                  type="checkbox"
                  checked={enableROASAnalysis}
                  onChange={(e) => setEnableROASAnalysis(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Buttons */}
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Ajustes de IA</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

