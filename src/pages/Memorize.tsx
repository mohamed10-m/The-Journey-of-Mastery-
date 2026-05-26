import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSurahs, Surah } from '../utils/quranApi';
import { motion } from 'motion/react';
import { Search, ChevronRight, Loader2 } from 'lucide-react';

export default function Memorize() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const data = await fetchSurahs();
        setSurahs(data);
      } catch (error) {
        console.error('Failed to load Surahs', error);
        setError('حدث خطأ أثناء تحميل قائمة السور. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };
    loadSurahs();
  }, []);

  const filteredSurahs = surahs.filter(
    (s) =>
      searchQuery === '' ||
      (s.englishName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name || '').includes(searchQuery) ||
      s.number.toString() === searchQuery
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">عذراً</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          اختر السورة
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          اختر سورة لتبدأ جلسة التسميع.
        </p>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pr-10 pl-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
          placeholder="ابحث بالاسم أو الرقم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3 pb-20">
        {filteredSurahs.map((surah, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            key={surah.number}
            onClick={() => navigate(`/surah/${surah.number}`)}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-semibold text-slate-500 dark:text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                {surah.number}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-xl font-amiri">
                  {surah.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {surah.englishName} • {surah.numberOfAyahs} آية
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-bold text-xl text-slate-800 dark:text-slate-200">
                {surah.number}
              </span>
              <ChevronRight className="text-slate-300 group-hover:text-primary-500 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
