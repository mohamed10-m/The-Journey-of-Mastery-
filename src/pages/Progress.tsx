import { useStore } from '../store/useStore';
import { motion } from 'motion/react';
import { BarChart2, Calendar, Target, Award, Map } from 'lucide-react';

export default function Progress() {
  const { testHistory, streakDays, memorizedSurahs } = useStore();

  const totalTests = testHistory.length;
  const averageAccuracy = totalTests > 0
    ? Math.round(testHistory.reduce((acc, test) => acc + test.accuracy, 0) / totalTests)
    : 0;

  const totalCorrectWords = testHistory.reduce((acc, test) => acc + test.correctWords, 0);

  // Generate 114 surahs for the map
  const surahMap = Array.from({ length: 114 }, (_, i) => i + 1);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-24">
      <header className="pt-4 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          تقدمك
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          تابع رحلة حفظك بمرور الوقت.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Target className="text-primary-500" size={20} />
            <h3 className="font-medium text-slate-600 dark:text-slate-400">متوسط الدقة</h3>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{averageAccuracy}</span>
            <span className="text-slate-500 text-sm">%</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-4">
            <BarChart2 className="text-indigo-500" size={20} />
            <h3 className="font-medium text-slate-600 dark:text-slate-400">إجمالي الاختبارات</h3>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{totalTests}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Award className="text-amber-500" size={20} />
            <h3 className="font-medium text-slate-600 dark:text-slate-400">الكلمات المتلوة</h3>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{totalCorrectWords}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="text-rose-500" size={20} />
            <h3 className="font-medium text-slate-600 dark:text-slate-400">أيام المتابعة</h3>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{streakDays}</span>
            <span className="text-slate-500 text-sm">أيام</span>
          </div>
        </motion.div>
      </div>

      <section className="pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="text-primary-500" size={24} />
            خريطة الحفظ
          </h2>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">
            {memorizedSurahs.length} / 114 سورة
          </span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-10 sm:grid-cols-12 gap-2" dir="rtl">
            {surahMap.map((surahNum) => {
              const isMemorized = memorizedSurahs.includes(surahNum);
              return (
                <div 
                  key={surahNum}
                  title={`سورة رقم ${surahNum}`}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all
                    ${isMemorized 
                      ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}
                  `}
                >
                  {surahNum}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary-500"></div>
              <span>محفوظة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
              <span>غير محفوظة</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">سجل الاختبارات</h2>
        {testHistory.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">لم تقم بأي اختبارات بعد.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testHistory.map((test, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={test.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-lg">{test.surahName || `سورة ${test.surahNumber}`}</h4>
                  <p className="text-sm text-slate-500">الآيات {test.startAyah} - {test.endAyah}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(test.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${test.accuracy >= 90 ? 'text-primary-500' : test.accuracy >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                    {test.accuracy}%
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
                    {test.correctWords} كلمة
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
