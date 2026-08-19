import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Sparkles,
  Key,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Check,
  Bot,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Square,
  FileText,
  MessageSquare,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import { AISettings } from '../types';
import { speakText, stopSpeaking, getAvailableSpanishVoices } from '../lib/voice';

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
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || (settings.provider === 'gemini' ? settings.apiKey || '' : ''));
  const [openAiApiKey, setOpenAiApiKey] = useState(settings.openAiApiKey || (settings.provider === 'openai' ? settings.apiKey || '' : ''));
  
  const [model, setModel] = useState<string>(
    settings.model || (settings.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.6-flash')
  );
  const [responseMode, setResponseMode] = useState<'both' | 'voice' | 'text'>(
    settings.responseMode || (settings.enableVoiceResponse === false ? 'text' : 'both')
  );
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);
  const [assistantName, setAssistantName] = useState(settings.assistantName || "D'RAYO AI");
  const [systemInstruction, setSystemInstruction] = useState(
    settings.systemInstruction ||
      `Eres "${assistantName}", el asesor financiero, estratega de Meta Ads y asistente ejecutivo oficial de la marca D'RAYO (E-commerce de moda/ropa en Perú). Tu misión es maximizar la rentabilidad, auditar el ROAS y acelerar las ventas por WhatsApp.`
  );
  const [enableWhatsAppSuggestions, setEnableWhatsAppSuggestions] = useState(settings.enableWhatsAppSuggestions ?? true);
  const [enableStockAlerts, setEnableStockAlerts] = useState(settings.enableStockAlerts ?? true);
  const [enableROASAnalysis, setEnableROASAnalysis] = useState(settings.enableROASAnalysis ?? true);

  // Voice Settings State
  const [voiceSpeed, setVoiceSpeed] = useState(settings.voiceSpeed ?? 1.0);
  const [voicePitch, setVoicePitch] = useState(settings.voicePitch ?? 1.0);
  const [voiceName, setVoiceName] = useState(settings.voiceName || '');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);

  // Connection Test States
  const [testResult, setTestResult] = useState<{
    providerTesting?: 'gemini' | 'openai';
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
    latencyMs?: number;
    modelUsed?: string;
  }>({ status: 'idle' });

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = getAvailableSpanishVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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

  const handleTestConnectionFor = async (targetProvider: 'gemini' | 'openai') => {
    const keyToTest = targetProvider === 'gemini' ? geminiApiKey.trim() : openAiApiKey.trim();
    const modelToTest = targetProvider === 'gemini' ? 'gemini-3.6-flash' : 'gpt-4o-mini';

    setTestResult({ status: 'testing', providerTesting: targetProvider });
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          apiKey: keyToTest || undefined,
          model: modelToTest,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setTestResult({
          status: 'success',
          providerTesting: targetProvider,
          message: data.message || `Conexión exitosa con ${targetProvider === 'openai' ? 'OpenAI' : 'Google Gemini'}`,
          latencyMs: data.latencyMs,
          modelUsed: data.modelUsed,
        });
      } else {
        setTestResult({
          status: 'error',
          providerTesting: targetProvider,
          message: data.error || `No se pudo conectar con ${targetProvider === 'openai' ? 'OpenAI' : 'Google Gemini'}.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        providerTesting: targetProvider,
        message: err.message || 'Error de red al probar conexión.',
      });
    }
  };

  const handleTestVoiceAudio = () => {
    if (isPlayingTestVoice) {
      stopSpeaking();
      setIsPlayingTestVoice(false);
      return;
    }

    setIsPlayingTestVoice(true);
    speakText(
      `¡Hola! Soy ${assistantName}. Tu asistente de voz ejecutiva está configurado y listo para analizar tus métricas en tiempo real.`,
      {
        speed: voiceSpeed,
        pitch: voicePitch,
        voiceName: voiceName || undefined,
        onStart: () => setIsPlayingTestVoice(true),
        onEnd: () => setIsPlayingTestVoice(false),
        onError: () => setIsPlayingTestVoice(false),
      }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    stopSpeaking();
    
    const activeApiKey = provider === 'gemini' ? geminiApiKey.trim() : openAiApiKey.trim();

    onSaveSettings({
      provider,
      apiKey: activeApiKey || undefined,
      geminiApiKey: geminiApiKey.trim() || undefined,
      openAiApiKey: openAiApiKey.trim() || undefined,
      model,
      temperature,
      assistantName: assistantName.trim() || "D'RAYO AI",
      systemInstruction,
      responseMode,
      enableVoiceResponse: responseMode !== 'text',
      enableWhatsAppSuggestions,
      enableStockAlerts,
      enableROASAnalysis,
      voiceSpeed,
      voicePitch,
      voiceName: voiceName || undefined,
    });
    onClose();
  };

  const geminiModels = [
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', tag: 'Recomendado', desc: 'Ultra veloz y análisis financiero preciso' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Equilibrado', desc: 'Respuesta balanceada en tiempo real' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Avanzado', desc: 'Máximo razonamiento multimodal' },
  ];

  const openAiModels = [
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', tag: 'Económico', desc: 'Rápido, inteligente y bajo costo' },
    { id: 'gpt-4o', name: 'GPT-4o (Omni)', tag: 'Máxima Potencia', desc: 'Razonamiento superior y estructurado' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', tag: 'Clásico', desc: 'Velocidad y respuestas breves' },
  ];

  const currentModels = provider === 'openai' ? openAiModels : geminiModels;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Ajustes de Inteligencia Artificial & Voz</h3>
              <p className="text-xs text-slate-500">Configuración de API Keys (Gemini & OpenAI), modo de voz y análisis PRO</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          
          {/* ========================================================================= */}
          {/* SECCIÓN 1: PROVEEDORES Y CLAVES DE API (GEMINI & OPENAI) */}
          {/* ========================================================================= */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Claves de API y Motor Activo</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Motor activo: <strong className="text-slate-800 uppercase">{provider}</strong>
              </span>
            </div>

            {/* Provider Selector Tabs */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  provider === 'gemini'
                    ? 'bg-blue-50/90 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    provider === 'gemini' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-xs text-slate-900 block">Google Gemini</span>
                    <span className="text-[10px] text-slate-500">Gemini 3.6 Flash / Pro</span>
                  </div>
                </div>
                {provider === 'gemini' && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  provider === 'openai'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    provider === 'openai' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-xs text-slate-900 block">OpenAI</span>
                    <span className="text-[10px] text-slate-500">GPT-4o / GPT-4o mini</span>
                  </div>
                </div>
                {provider === 'openai' && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </button>
            </div>

            {/* Google Gemini Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              provider === 'gemini'
                ? 'bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border-blue-300 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 opacity-90'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>API Key de Google Gemini</span>
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                    Gratis / Google AI Studio
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Obtener Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {showGeminiKey ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Por defecto usa GEMINI_API_KEY del servidor (o pega AIzaSy...)"
                  className="flex-1 bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleTestConnectionFor('gemini')}
                  disabled={testResult.status === 'testing' && testResult.providerTesting === 'gemini'}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Probar conexión con Gemini"
                >
                  {testResult.status === 'testing' && testResult.providerTesting === 'gemini' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Probar</span>
                </button>
              </div>

              {testResult.providerTesting === 'gemini' && testResult.status === 'success' && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-[11px]">{testResult.message}</span>
                  </div>
                  {testResult.latencyMs && (
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              {testResult.providerTesting === 'gemini' && testResult.status === 'error' && (
                <div className="mt-2 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium text-[11px]">{testResult.message}</span>
                </div>
              )}
            </div>

            {/* OpenAI Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              provider === 'openai'
                ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border-emerald-300 shadow-xs'
                : 'bg-slate-50/80 border-slate-200 opacity-90'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                    <span>API Key de OpenAI</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    sk-...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                  >
                    <span>Obtener Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                    className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {showOpenAiKey ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type={showOpenAiKey ? 'text' : 'password'}
                  value={openAiApiKey}
                  onChange={(e) => setOpenAiApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="flex-1 bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleTestConnectionFor('openai')}
                  disabled={testResult.status === 'testing' && testResult.providerTesting === 'openai'}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Probar conexión con OpenAI"
                >
                  {testResult.status === 'testing' && testResult.providerTesting === 'openai' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Probar</span>
                </button>
              </div>

              {testResult.providerTesting === 'openai' && testResult.status === 'success' && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-[11px]">{testResult.message}</span>
                  </div>
                  {testResult.latencyMs && (
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              {testResult.providerTesting === 'openai' && testResult.status === 'error' && (
                <div className="mt-2 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium text-[11px]">{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Model Selector for Active Provider */}
            <div className="space-y-2 pt-1">
              <label className="text-slate-800 font-bold block flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Modelo Activo de {provider === 'openai' ? 'OpenAI' : 'Google Gemini'}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentModels.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      model === m.id
                        ? 'bg-blue-50/80 border-blue-500 text-slate-900 shadow-2xs ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{m.name}</span>
                        {model === m.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{m.desc}</span>
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
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: MODO DE RESPUESTA DE LA IA (VOZ O TEXTO) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Modo de Respuesta: Voz o Texto</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {responseMode === 'both' ? 'Texto + Voz en Vivo' : responseMode === 'voice' ? 'Solo Voz' : 'Solo Texto'}
              </span>
            </div>

            {/* 3 Response Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              <button
                type="button"
                onClick={() => setResponseMode('both')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  responseMode === 'both'
                    ? 'bg-indigo-50/90 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>Texto + Voz</span>
                  </div>
                  {responseMode === 'both' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Muestra la respuesta estructurada en pantalla y la lee en voz alta al instante.
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                  Recomendado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResponseMode('voice')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  responseMode === 'voice'
                    ? 'bg-indigo-50/90 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                    <span>Solo Voz</span>
                  </div>
                  {responseMode === 'voice' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Lectura auditiva fluida optimizada para manos libres y escucha ejecutiva rápida.
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Audio Prioritario
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResponseMode('text')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  responseMode === 'text'
                    ? 'bg-slate-100 border-slate-600 shadow-xs ring-2 ring-slate-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <VolumeX className="w-4 h-4 text-slate-500" />
                    <span>Solo Texto</span>
                  </div>
                  {responseMode === 'text' && <Check className="w-3.5 h-3.5 text-slate-700" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Modo silencioso, ideal para leer tablas y números en pantalla sin reproducción de audio.
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Silencioso
                </span>
              </button>

            </div>

            {/* Voice Audio Parameters (when not text-only) */}
            {responseMode !== 'text' && (
              <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/60 p-4 rounded-xl border border-indigo-200/80 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Velocidad de voz:</span>
                      <span className="font-mono text-indigo-700">{voiceSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.1"
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>0.8x Lento</span>
                      <span>1.0x Normal</span>
                      <span>1.4x Dinámico</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Tono de voz:</span>
                      <span className="font-mono text-indigo-700">{voicePitch.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.2"
                      step="0.1"
                      value={voicePitch}
                      onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Grave (0.8)</span>
                      <span>Natural (1.0)</span>
                      <span>Agudo (1.2)</span>
                    </div>
                  </div>
                </div>

                {availableVoices.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Voz en Español Detectada en tu Sistema:
                    </label>
                    <select
                      value={voiceName}
                      onChange={(e) => setVoiceName(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="">Automática (Predeterminada del navegador)</option>
                      {availableVoices.map((v, i) => (
                        <option key={i} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTestVoiceAudio}
                  className="w-full bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs text-xs"
                >
                  {isPlayingTestVoice ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current text-indigo-700" />
                      <span>Detener prueba de voz</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-indigo-700" />
                      <span>Probar audio de voz en vivo</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 3: PÁRRAFOS PRO & INTELIGENCIA FINANCIERA */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Estilo de Párrafos PRO y Módulos Activos</span>
            </span>

            {/* Custom Assistant Name & System Prompt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-800 font-bold block mb-1">Nombre del Asistente Virtual</label>
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Ej: D'RAYO AI..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-800 font-bold block">Creatividad / Precisión</label>
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
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
                  className="w-full accent-blue-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>0.0 Preciso</span>
                  <span>0.7 Equilibrado</span>
                  <span>1.0 Creativo</span>
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center justify-between cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <div>
                  <span className="text-slate-800 font-bold block text-xs">Ventas WhatsApp</span>
                  <span className="text-[10px] text-slate-500">Cierres y respuestas</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableWhatsAppSuggestions}
                  onChange={(e) => setEnableWhatsAppSuggestions(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <div>
                  <span className="text-slate-800 font-bold block text-xs">Alertas de Stock</span>
                  <span className="text-[10px] text-slate-500">Avisos de reposición</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableStockAlerts}
                  onChange={(e) => setEnableStockAlerts(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <div>
                  <span className="text-slate-800 font-bold block text-xs">Diagnóstico ROAS</span>
                  <span className="text-[10px] text-slate-500">Cálculo de Ads & CPA</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableROASAnalysis}
                  onChange={(e) => setEnableROASAnalysis(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

