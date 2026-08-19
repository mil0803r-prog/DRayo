/**
 * Speech synthesis & recognition helper for D'RAYO AI voice capabilities
 */

export function cleanTextForSpeech(markdownText: string): string {
  if (!markdownText) return '';

  let text = markdownText;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, ' [código omitido] ');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove markdown headings, bold, italic
  text = text.replace(/#+\s+/g, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Convert currency indicators into natural speech
  text = text.replace(/S\/\s*(\d+(?:\.\d+)?)/g, '$1 soles');
  text = text.replace(/PEN\s*(\d+(?:\.\d+)?)/g, '$1 soles');
  text = text.replace(/ROAS:\s*(\d+(?:\.\d+)?)x/gi, 'ROAS de $1 veces');
  text = text.replace(/(\d+(?:\.\d+)?)x/g, '$1 equis');
  text = text.replace(/und\./gi, 'unidades');
  text = text.replace(/unds\./gi, 'unidades');

  // Remove list bullets and markers
  text = text.replace(/^[-*•]\s+/gm, ' ');
  text = text.replace(/\n\s*[-*•]\s+/g, '. ');

  // Remove URLs
  text = text.replace(/https?:\/\/\S+/g, ' enlace ');

  // Clean emojis
  text = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, ' ');

  // Clean excessive spaces and newlines
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export function getAvailableSpanishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(
    (v) =>
      v.lang.startsWith('es') ||
      v.lang.includes('ES') ||
      v.lang.includes('MX') ||
      v.lang.includes('PE') ||
      v.lang.includes('US')
  );
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  rawText: string,
  options?: {
    speed?: number;
    pitch?: number;
    voiceName?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported on this browser.');
    return null;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  const textToSpeak = cleanTextForSpeech(rawText);
  if (!textToSpeak) return null;

  try {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = options?.speed ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.lang = 'es-PE';

    // Find best Spanish voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (options?.voiceName) {
      selectedVoice = voices.find((v) => v.name === options.voiceName);
    }

    if (!selectedVoice) {
      // Prioritize Latin American Spanish or standard Spanish natural voices
      selectedVoice =
        voices.find((v) => v.lang === 'es-PE' || v.lang === 'es_PE') ||
        voices.find((v) => v.lang === 'es-MX' || v.lang === 'es_MX') ||
        voices.find((v) => v.lang === 'es-US' || v.lang === 'es_US') ||
        voices.find((v) => v.lang.startsWith('es') && (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('sabina') || v.name.toLowerCase().includes('jorge'))) ||
        voices.find((v) => v.lang.startsWith('es'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (options?.onError) options.onError(e);
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.error('Error starting speech synthesis:', err);
    if (options?.onError) options.onError(err);
    return null;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  return window.speechSynthesis.speaking;
}

export function pauseSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
}

// Web Speech Recognition for Microphone input
export function startSpeechRecognition(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError?: (err: any) => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('SpeechRecognition is not supported in this browser.');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    
    // Choose best Spanish language locale
    const browserLang = (typeof navigator !== 'undefined' && navigator.language) || 'es-PE';
    recognition.lang = browserLang.toLowerCase().startsWith('es') ? browserLang : 'es-PE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let accumulatedFinalText = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          accumulatedFinalText += (accumulatedFinalText ? ' ' : '') + transcript.trim();
        } else {
          interimTranscript += transcript;
        }
      }

      const currentCombined = accumulatedFinalText + (interimTranscript ? ' ' + interimTranscript : '');
      if (currentCombined.trim()) {
        onResult(currentCombined.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Non-fatal, keep listening or wait
        return;
      }
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (accumulatedFinalText.trim()) {
        onResult(accumulatedFinalText.trim(), true);
      }
      if (onEnd) onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
      },
      abort: () => {
        try {
          recognition.abort();
        } catch {}
      },
    };
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    if (onError) onError(err);
    return null;
  }
}
