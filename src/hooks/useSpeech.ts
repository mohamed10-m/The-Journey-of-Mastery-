import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef('');
  const currentSessionFinalRef = useRef('');
  const isManuallyStoppedRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';

      // Check for Android Chrome cumulative bug
      let isCumulativeBug = false;
      if (event.results.length > 1) {
        const prev = event.results[event.results.length - 2][0].transcript.trim();
        const curr = event.results[event.results.length - 1][0].transcript.trim();
        if (curr.startsWith(prev) && prev.length > 0) {
          isCumulativeBug = true;
        }
      }

      if (isCumulativeBug) {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          final = lastResult[0].transcript + ' ';
        } else {
          interim = lastResult[0].transcript + ' ';
        }
      } else {
        // Iterate from 0 to get all final results for this session safely
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript + ' ';
          }
        }
      }

      currentSessionFinalRef.current = final;
      setTranscript(accumulatedTranscriptRef.current + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      let errorMessage = `حدث خطأ: ${event.error}`;
      
      if (event.error === 'not-allowed') {
        errorMessage = 'الرجاء السماح بالوصول إلى الميكروفون في إعدادات المتصفح.';
        isManuallyStoppedRef.current = true; // Fatal error, don't auto-restart
      } else if (event.error === 'audio-capture') {
        errorMessage = 'لم يتم العثور على ميكروفون أو فشل التقاط الصوت. تأكد من توصيل الميكروفون.';
        isManuallyStoppedRef.current = true; // Fatal error
      } else if (event.error === 'network') {
        errorMessage = 'حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت، أو تفعيل التعرف على الصوت بلا اتصال (Offline Speech Recognition) وتحميل حزمة اللغة العربية في إعدادات هاتفك.';
        isManuallyStoppedRef.current = true; // Fatal error
      } else if (event.error === 'no-speech') {
        // 'no-speech' is not fatal, the browser just timed out listening.
        // We will let it auto-restart in onend.
        // Do not set error state to prevent UI flicker
        return;
      } else if (event.error === 'aborted') {
        // Expected when we call stop()
        isManuallyStoppedRef.current = true;
      }
      
      setError(errorMessage);
      if (isManuallyStoppedRef.current) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Session ended. Add this session's final text to the accumulated text.
      accumulatedTranscriptRef.current += currentSessionFinalRef.current;
      currentSessionFinalRef.current = '';
      
      // If the user didn't manually stop it, and it wasn't a fatal error, restart it automatically
      if (!isManuallyStoppedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to auto-restart recognition', e);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isManuallyStoppedRef.current = true;
        recognitionRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures this effect only runs once on mount

  const startListening = useCallback(async () => {
    if (recognitionRef.current && !isListening) {
      isManuallyStoppedRef.current = false;
      // Don't clear transcript on restart, we want to append
      setError(null);
      
      try {
        // Keep mic hardware active to make restarts instant and prevent dropped words
        if (!mediaStreamRef.current && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (err) {
        console.warn('Could not acquire media stream for keep-alive', err);
      }

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition', e);
        setError('فشل في بدء التعرف على الصوت.');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isManuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
    currentSessionFinalRef.current = '';
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
