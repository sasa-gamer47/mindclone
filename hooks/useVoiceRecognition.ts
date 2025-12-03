import { useState, useEffect, useRef, useCallback } from 'react';

// This is to make TypeScript happy since SpeechRecognition types are not standard everywhere
// FIX: Add full type definitions for the Web Speech API to resolve TS errors.
declare global {
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly resultIndex: number;
  }

  // This type is available in lib.dom.d.ts but can be explicitly defined for safety
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }
}

interface VoiceRecognitionParams {
  onResult?: (transcript: string) => void;
  onError?: (error: SpeechRecognitionErrorEvent) => void;
  onEnd?: () => void;
}

export const useVoiceRecognition = ({ onResult, onError, onEnd }: VoiceRecognitionParams = {}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasSupport = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!hasSupport) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && onResult) {
        onResult(finalTranscript.trim());
      }
    };
    
    recognition.onend = () => {
        setIsListening(false);
        if (onEnd) onEnd();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (onError) onError(event);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
    };
  }, [hasSupport, onResult, onError, onEnd]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will set isListening to false
    }
  }, [isListening]);

  return { isListening, startListening, stopListening, hasSupport };
};
