import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSurah, SurahDetail, normalizeArabic } from '../utils/quranApi';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, BookOpen, ZoomIn, ZoomOut } from 'lucide-react';
import { useStore } from '../store/useStore';

const toArabicNumerals = (num: number) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(c => arabicNumbers[parseInt(c)]).join('');
};

export default function SurahView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const themePreferences = useStore((state) => state.themePreferences);
  const setThemePreferences = useStore((state) => state.setThemePreferences);
  const fontSize = themePreferences.fontSize || 36;

  const handleZoomIn = () => {
    setThemePreferences({ fontSize: Math.min(fontSize + 4, 72) });
  };

  const handleZoomOut = () => {
    setThemePreferences({ fontSize: Math.max(fontSize - 4, 20) });
  };

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

  if (loading || !surah) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary-500" size={48} />
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
          <p className="text-xs text-slate-500">{surah.englishName}</p>
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

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full pb-[calc(8rem+env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#fdfbf7] dark:bg-slate-900 rounded-3xl p-6 md:p-14 border-[12px] border-[#e8e0cc] dark:border-slate-800 shadow-2xl min-h-[70vh] relative overflow-hidden"
        >
          {/* Decorative inner border */}
          <div className="absolute inset-2 border-2 border-[#d4c5a9] dark:border-slate-700 rounded-2xl pointer-events-none"></div>
          
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#c5b38e] dark:border-slate-600 rounded-tl-xl opacity-70 pointer-events-none"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#c5b38e] dark:border-slate-600 rounded-tr-xl opacity-70 pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#c5b38e] dark:border-slate-600 rounded-bl-xl opacity-70 pointer-events-none"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#c5b38e] dark:border-slate-600 rounded-br-xl opacity-70 pointer-events-none"></div>

          <div className="relative z-10 pt-4">
            {surah.number !== 1 && surah.number !== 9 && (
              <div className="text-center mb-10 pb-6 border-b border-[#e8e0cc] dark:border-slate-800 mx-auto max-w-md">
                <span className="quran-text text-slate-800 dark:text-slate-200" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
              </div>
            )}
            
            <div className="text-justify" dir="rtl" style={{ lineHeight: 2.2 }}>
            {surah.ayahs.map((ayah) => {
              // Remove Bismillah from the first ayah if it's not Surah Al-Fatihah
              let text = ayah.text;
              if (surah.number !== 1 && ayah.numberInSurah === 1) {
                const words = text.split(/\s+/).filter(Boolean);
                if (words.length >= 4) {
                  const first4 = words.slice(0, 4).join(' ');
                  if (normalizeArabic(first4) === 'بسم الله الرحمن الرحيم') {
                    text = words.slice(4).join(' ');
                  }
                }
              }
              
              return (
                <span key={ayah.number} className="inline quran-text text-slate-900 dark:text-slate-100" style={{ fontSize: `${fontSize}px` }}>
                  {text} <span className="text-[#b59a6d] dark:text-primary-500 mx-2 select-none" style={{ fontSize: `${fontSize * 0.75}px` }}>﴿{toArabicNumerals(ayah.numberInSurah)}﴾</span>{' '}
                </span>
              );
            })}
            </div>
          </div>
        </motion.div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950 flex justify-center pb-24 md:pb-6 z-50 pointer-events-none">
        <button
          onClick={() => navigate(`/setup/${surah.number}`)}
          className="w-full max-w-sm flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-primary-500/30 pointer-events-auto"
        >
          <BookOpen size={20} className="ml-2" />
          <span>اختبر حفظك</span>
        </button>
      </div>
    </div>
  );
}
