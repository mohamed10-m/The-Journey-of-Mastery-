import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchSurah, SurahDetail, Ayah, normalizeArabic } from '../utils/quranApi';
import { useSpeech } from '../hooks/useSpeech';
import { calculateAccuracy, alignRecitation, WordStatus } from '../utils/compare';
import { useStore } from '../store/useStore';
import { playSuccessSound } from '../utils/audio';
import { motion } from 'motion/react';
import { Mic, MicOff, Loader2, ArrowLeft, CheckCircle2, RotateCcw, Share2, ZoomIn, ZoomOut, BookOpen } from 'lucide-react';

const toArabicNumerals = (num: number) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(c => arabicNumbers[parseInt(c)]).join('');
};

export default function TestMode() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startAyah = parseInt(searchParams.get('start') || '1');
  const endAyah = parseInt(searchParams.get('end') || '1');

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [testFinished, setTestFinished] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalStats, setFinalStats] = useState<any>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const themePreferences = useStore((state) => state.themePreferences);
  const setThemePreferences = useStore((state) => state.setThemePreferences);
  const fontSize = themePreferences.fontSize || 36;

  const handleZoomIn = () => {
    setThemePreferences({ fontSize: Math.min(fontSize + 4, 72) });
  };

  const handleZoomOut = () => {
    setThemePreferences({ fontSize: Math.max(fontSize - 4, 20) });
  };

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeech();

  const addTestResult = useStore((state) => state.addTestResult);
  const addMemorizedSurah = useStore((state) => state.addMemorizedSurah);

  useEffect(() => {
    const loadSurah = async () => {
      try {
        if (id) {
          const data = await fetchSurah(parseInt(id));
          setSurah(data);
        }
      } catch (error) {
        console.error('Failed to load Surah', error);
      } finally {
        setLoading(false);
      }
    };
    loadSurah();
  }, [id]);

  const testAyahs = useMemo(() => {
    if (!surah) return [];
    return surah.ayahs.filter(
      (a) => a.numberInSurah >= startAyah && a.numberInSurah <= endAyah
    );
  }, [surah, startAyah, endAyah]);

  // Extract all words from the selected Ayahs
  const expectedWords = useMemo(() => {
    const words: { text: string; ayahNumber: number; isBismillah: boolean }[] = [];
    testAyahs.forEach((ayah) => {
      let text = ayah.text;
      let isBismillah = false;
      
      const ayahWords = text.split(/\s+/).filter(Boolean);
      
      // Remove Bismillah from the first Ayah of any Surah (except Al-Fatiha)
      if (surah?.number !== 1 && ayah.numberInSurah === 1) {
        const first4 = ayahWords.slice(0, 4).join(' ');
        if (normalizeArabic(first4) === 'بسم الله الرحمن الرحيم') {
          ayahWords.splice(0, 4);
        }
      }

      ayahWords.forEach((w) => words.push({ text: w, ayahNumber: ayah.numberInSurah, isBismillah }));
    });
    return words;
  }, [testAyahs, surah]);

  const expectedWordsText = useMemo(() => expectedWords.map(w => w.text), [expectedWords]);
  
  const spokenText = useMemo(() => {
    // Only use the final transcript for actual matching to avoid flickering
    // and false positives from interim results that might change.
    let text = transcript.trim();
    
    // Strip Isti'adha (full or partial at the beginning) to prevent flickering
    // Made more forgiving to handle common speech recognition errors
    const istiadhaRegex = /^(?:اعوذ|أعوذ|عوذ|تعوذ)(?:\s+بالله)?(?:\s+(?:السميع\s+العليم\s+)?من)?(?:\s+الشيطان)?(?:\s+الرجيم)?\s*/i;
    text = text.replace(istiadhaRegex, '');
    
    // Then strip Bismillah if it's not Surah Al-Fatiha
    if (surah?.number !== 1) {
      const bismillahRegex = /^(?:بسم|باسم)(?:\s+الله)?(?:\s+(?:الرحمن|الرحمان))?(?:\s+الرحيم)?\s*/i;
      text = text.replace(bismillahRegex, '');
    }
    
    return text.trim();
  }, [transcript, surah]);
  
  const wordStatuses = useMemo(() => {
    return alignRecitation(expectedWordsText, spokenText);
  }, [expectedWordsText, spokenText]);

  const finishTest = useCallback(() => {
    stopListening();
    
    // Calculate final stats
    const originalText = expectedWordsText.join(' ');
    const stats = calculateAccuracy(originalText, spokenText);
    
    setFinalStats(stats);
    setTestFinished(true);

    if (surah) {
      const pointsBefore = useStore.getState().points;
      addTestResult({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        surahNumber: surah.number,
        surahName: surah.name,
        startAyah,
        endAyah,
        accuracy: stats.accuracy,
        correctWords: stats.correctWords,
        mistakes: stats.mistakes,
        missingWords: stats.missingWords,
      });
      const pointsAfter = useStore.getState().points;
      setEarnedPoints(pointsAfter - pointsBefore);

      // Update challenges progress is handled by addTestResult

      // If the user recited up to the end of the surah with good accuracy, mark it as memorized
      if (endAyah === surah.numberOfAyahs && stats.accuracy >= 80) {
        addMemorizedSurah(surah.number);
      }
    }
  }, [stopListening, expectedWordsText, spokenText, surah, startAyah, endAyah, addTestResult, addMemorizedSurah]);

  const [lastTranscriptTime, setLastTranscriptTime] = useState(Date.now());
  const [hintedWords, setHintedWords] = useState<number[]>([]);

  useEffect(() => {
    setLastTranscriptTime(Date.now());
  }, [transcript]);

  // Auto-completion and hint logic
  useEffect(() => {
    if (isCompleted || testFinished || wordStatuses.length === 0) return;

    const isLastWordCorrect = wordStatuses[wordStatuses.length - 1] === 'correct';
    const isLastWordProcessed = wordStatuses[wordStatuses.length - 1] !== 'pending';
    const spokenWordsCount = spokenText.split(/\s+/).filter(Boolean).length;
    const expectedWordsCount = expectedWordsText.length;

    if (isLastWordCorrect) {
      setIsCompleted(true);
      stopListening();
      playSuccessSound();
      
      // Wait a moment for the user to see the checkmark and hear the sound
      setTimeout(() => {
        finishTest();
      }, 1500);
    } else if (isLastWordProcessed || spokenWordsCount >= expectedWordsCount) {
      // If the user has spoken enough words but the last word isn't correct,
      // wait a few seconds to see if they correct it. If not, auto-finish.
      const timeout = setTimeout(() => {
        setIsCompleted(true);
        stopListening();
        playSuccessSound();
        setTimeout(() => {
          finishTest();
        }, 1500);
      }, 3000); // 3 seconds delay
      
      return () => clearTimeout(timeout);
    } else if (isListening) {
      // Show hint after 3 seconds of silence
      const hintTimeout = setTimeout(() => {
        const firstPendingIndex = wordStatuses.findIndex(status => status === 'pending');
        if (firstPendingIndex !== -1) {
          setHintedWords(prev => {
            if (!prev.includes(firstPendingIndex)) {
              return [...prev, firstPendingIndex];
            }
            return prev;
          });
        }
      }, 3000);

      // Auto-finish after 8 seconds of silence, only if they started speaking
      const silenceTimeout = setTimeout(() => {
        if (spokenWordsCount > 0) {
          setIsCompleted(true);
          stopListening();
          playSuccessSound();
          setTimeout(() => {
            finishTest();
          }, 1500);
        }
      }, 8000);
      
      return () => {
        clearTimeout(hintTimeout);
        clearTimeout(silenceTimeout);
      };
    }
  }, [wordStatuses, spokenText, expectedWordsText.length, isCompleted, testFinished, stopListening, finishTest, isListening, lastTranscriptTime]);

  const handleRetry = () => {
    setTestFinished(false);
    setIsCompleted(false);
    setFinalStats(null);
    setEarnedPoints(null);
    setHintedWords([]);
    resetTranscript();
  };

  if (loading || !surah) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  if (testFinished && finalStats) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-8 pb-24">
        <header className="pt-8 pb-4 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            نتائج الاختبار
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-amiri text-xl">
            {surah.name} (الآيات {startAyah} - {endAyah})
          </p>
        </header>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center"
        >
          <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 bg-slate-50 dark:bg-slate-800">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - finalStats.accuracy / 100)}
                className={`${finalStats.accuracy >= 90 ? 'text-primary-500' : finalStats.accuracy >= 70 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
              />
            </svg>
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{finalStats.accuracy}%</span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center mt-6">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{finalStats.correctWords}</div>
              <div className="text-xs text-primary-800 dark:text-primary-300 uppercase tracking-wider font-semibold mt-1">صحيح</div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{finalStats.mistakes}</div>
              <div className="text-xs text-red-800 dark:text-red-300 uppercase tracking-wider font-semibold mt-1">أخطاء</div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{finalStats.missingWords}</div>
              <div className="text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider font-semibold mt-1">مفقود</div>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {earnedPoints !== null ? earnedPoints : 0}
              </div>
              <div className="text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-wider font-semibold mt-1">نقاط</div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-xl font-semibold text-lg transition-colors"
          >
            <RotateCcw size={20} className="ml-2" />
            <span>إعادة التسميع</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-semibold text-lg transition-colors"
          >
            <CheckCircle2 size={20} className="ml-2" />
            <span>حفظ التسميع والعودة للرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="text-slate-600 dark:text-slate-300" />
        </button>
        <div className="text-center">
          <h1 className="font-bold text-slate-900 dark:text-white font-amiri text-xl">{surah.name}</h1>
          <p className="text-xs text-slate-500">الآيات {startAyah} - {endAyah}</p>
        </div>
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          <button onClick={handleZoomOut} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ZoomOut size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <button onClick={handleZoomIn} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ZoomIn size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full pb-[calc(10rem+env(safe-area-inset-bottom))]">
        {error && (
          <div className="w-full p-4 mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#fdfbf7] dark:bg-slate-900 rounded-3xl p-6 md:p-14 border-[12px] border-[#e8e0cc] dark:border-slate-800 shadow-2xl min-h-[60vh] relative overflow-hidden">
          {/* Decorative inner border */}
          <div className="absolute inset-2 border-2 border-[#d4c5a9] dark:border-slate-700 rounded-2xl pointer-events-none"></div>
          
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#c5b38e] dark:border-slate-600 rounded-tl-xl opacity-70 pointer-events-none"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#c5b38e] dark:border-slate-600 rounded-tr-xl opacity-70 pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#c5b38e] dark:border-slate-600 rounded-bl-xl opacity-70 pointer-events-none"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#c5b38e] dark:border-slate-600 rounded-br-xl opacity-70 pointer-events-none"></div>
          
          <div className="relative z-10 pt-4">
            {surah.number !== 1 && surah.number !== 9 && startAyah === 1 && (
              <div className="text-center mb-10 pb-6 border-b border-[#e8e0cc] dark:border-slate-800 mx-auto max-w-md">
                <span className="quran-text text-slate-800 dark:text-slate-200" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
              </div>
            )}

            <div className="text-justify" dir="rtl" style={{ lineHeight: 2.2 }}>
              {expectedWords.map((wordObj, index) => {
                const status = wordStatuses[index];
                const isLastWordOfAyah = index === expectedWords.length - 1 || expectedWords[index + 1].ayahNumber !== wordObj.ayahNumber;
                const isHinted = hintedWords.includes(index) && status === 'pending';
                
                return (
                  <span key={index} className="inline quran-text" style={{ fontSize: `${fontSize}px` }}>
                    <span 
                      className={`
                        transition-all duration-300
                        ${status === 'correct' ? 'text-slate-900 dark:text-slate-100' : ''}
                        ${status === 'wrong' ? 'text-red-500' : ''}
                        ${status === 'pending' && !isHinted ? 'opacity-0 select-none' : ''}
                        ${isHinted ? 'text-primary-500 opacity-100' : ''}
                      `}
                    >
                      {wordObj.text}
                    </span>
                    
                    {isLastWordOfAyah && (
                      <span 
                        className={`
                          mx-2 transition-all duration-300 select-none
                          ${status === 'pending' ? 'opacity-0' : 'text-[#b59a6d] dark:text-primary-500'}
                        `}
                        style={{ fontSize: `${fontSize * 0.75}px` }}
                      >
                        ﴿{toArabicNumerals(wordObj.ayahNumber)}﴾
                      </span>
                    )}
                    {' '}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 flex flex-col items-center justify-center space-y-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950 z-50">
          <button
            onClick={isCompleted ? undefined : (isListening ? stopListening : startListening)}
            disabled={isCompleted}
            className={`
              relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-all duration-500
              ${isCompleted 
                ? 'bg-primary-500 text-white scale-110 shadow-primary-500/50' 
                : isListening 
                  ? 'bg-red-500 text-white shadow-red-500/50 scale-110 animate-pulse' 
                  : 'bg-primary-500 text-white shadow-primary-500/30 hover:scale-105'
              }
            `}
          >
            {isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <CheckCircle2 size={40} />
              </motion.div>
            ) : isListening ? (
              <MicOff size={28} />
            ) : (
              <Mic size={28} />
            )}
            
            {isListening && !isCompleted && (
              <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20"></span>
            )}
          </button>

          {!isCompleted && (
            <button
              onClick={finishTest}
              className="w-full max-w-sm flex items-center justify-center space-x-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              <CheckCircle2 size={20} className="ml-2" />
              <span>إنهاء الاختبار</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
