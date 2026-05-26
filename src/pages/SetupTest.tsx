import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSurah, SurahDetail } from '../utils/quranApi';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Loader2, BookOpen } from 'lucide-react';

export default function SetupTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [startAyah, setStartAyah] = useState<number | ''>(1);
  const [endAyah, setEndAyah] = useState<number | ''>(1);

  useEffect(() => {
    const loadSurah = async () => {
      try {
        if (id) {
          const data = await fetchSurah(parseInt(id));
          setSurah(data);
          setEndAyah(data.numberOfAyahs);
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

  const handleStart = () => {
    const start = typeof startAyah === 'number' ? startAyah : 1;
    const end = typeof endAyah === 'number' ? endAyah : surah.numberOfAyahs;
    navigate(`/test/${surah.number}?start=${start}&end=${end}`);
  };

  const handleStartAyahChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setStartAyah('');
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) {
      setStartAyah(num);
    }
  };

  const handleEndAyahChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setEndAyah('');
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) {
      setEndAyah(num);
    }
  };

  const handleStartAyahBlur = () => {
    let start = typeof startAyah === 'number' ? startAyah : 1;
    let end = typeof endAyah === 'number' ? endAyah : surah.numberOfAyahs;
    
    start = Math.max(1, Math.min(end, start));
    setStartAyah(start);
  };

  const handleEndAyahBlur = () => {
    let start = typeof startAyah === 'number' ? startAyah : 1;
    let end = typeof endAyah === 'number' ? endAyah : surah.numberOfAyahs;
    
    end = Math.max(start, Math.min(surah.numberOfAyahs, end));
    setEndAyah(end);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <header className="pt-8 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-amiri">
            {surah.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xl">
            {surah.englishName}
          </p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          اختر نطاق الآيات
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              من الآية
            </label>
            <input
              type="number"
              min={1}
              max={typeof endAyah === 'number' ? endAyah : surah.numberOfAyahs}
              value={startAyah}
              onChange={handleStartAyahChange}
              onBlur={handleStartAyahBlur}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              إلى الآية
            </label>
            <input
              type="number"
              min={typeof startAyah === 'number' ? startAyah : 1}
              max={surah.numberOfAyahs}
              value={endAyah}
              onChange={handleEndAyahChange}
              onBlur={handleEndAyahBlur}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-primary-500/30"
          >
            <Play size={20} />
            <span>ابدأ التسميع</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
