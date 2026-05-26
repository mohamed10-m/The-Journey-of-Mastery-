import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Flame, Award, Clock, Star, Target, Settings as SettingsIcon, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { useNetwork } from '../hooks/useNetwork';
import { useState } from 'react';
import OfflineDialog from '../components/OfflineDialog';

const LEVELS = [
  { name: 'مبتدئ', minPoints: 0 },
  { name: 'طالب علم', minPoints: 500 },
  { name: 'حافظ جزء', minPoints: 2000 },
  { name: 'حافظ 5 أجزاء', minPoints: 10000 },
  { name: 'حافظ نصف القرآن', minPoints: 30000 },
  { name: 'حافظ القرآن كاملًا', minPoints: 60000 },
];

export default function Home() {
  const { streakDays, testHistory, points, memorizationPlan, memorizedSurahs, userProfile } = useStore();
  const isOnline = useNetwork();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const navigate = useNavigate();

  const handleOnlineRequiredClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string, state?: any) => {
    if (!isOnline) {
      e.preventDefault();
      setShowOfflineDialog(true);
    } else {
      e.preventDefault();
      navigate(path, { state });
    }
  };

  const recentTests = testHistory.slice(0, 3);
  const averageAccuracy = testHistory.length > 0
    ? Math.round(testHistory.reduce((acc, test) => acc + test.accuracy, 0) / testHistory.length)
    : 0;

  const currentLevel = LEVELS.slice().reverse().find(l => points >= l.minPoints) || LEVELS[0];

  const today = new Date().toISOString().split('T')[0];
  const todayTests = testHistory.filter(t => {
    if (!t.date.startsWith(today)) return false;
    if (memorizationPlan && memorizationPlan.startDate.startsWith(today)) {
      return t.date >= memorizationPlan.startDate;
    }
    return true;
  });
  
  const uniqueAyahsToday = new Set<string>();
  todayTests.forEach(t => {
    for (let i = t.startAyah; i <= t.endAyah; i++) {
      uniqueAyahsToday.add(`${t.surahNumber}-${i}`);
    }
  });
  const todayAyahsCount = uniqueAyahsToday.size;
  
  const planProgress = memorizationPlan ? Math.min(100, Math.round((todayAyahsCount / memorizationPlan.dailyAyahs) * 100)) : 0;
  
  const nextSurahToMemorize = Array.from({length: 114}, (_, i) => i + 1).find(s => !memorizedSurahs.includes(s)) || 1;

  const formatPoints = (num: number) => {
    return Intl.NumberFormat('en-US', {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(num);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-24">
      <OfflineDialog isOpen={showOfflineDialog} onClose={() => setShowOfflineDialog(false)} />
      <header className="pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
            <div className="bg-primary-50 dark:bg-primary-900/30 p-2.5 rounded-xl border border-primary-100 dark:border-primary-800/50 shadow-sm">
              <BookOpen size={24} className="drop-shadow-sm" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-amiri">رحلة الاتقان</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#/profile" onClick={(e) => handleOnlineRequiredClick(e, '/profile')} className="flex flex-col items-center bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-sm">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold" dir="ltr">
                <Star size={16} className="fill-amber-500" />
                <span>{formatPoints(points)}</span>
              </div>
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-500">{currentLevel.name}</span>
            </a>
            <div className="flex items-center gap-2">
              <Link to="/about" className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <Info size={22} />
              </Link>
              <Link to="/settings" className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <SettingsIcon size={22} />
              </Link>
            </div>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            السلام عليكم{userProfile && userProfile.displayName !== 'مستخدم' ? ` يا ${userProfile.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            مستعد لمواصلة رحلة حفظ القرآن؟
          </p>
        </div>
      </header>

      {memorizationPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Target className="text-indigo-500" size={20} />
              <h3 className="font-medium text-slate-900 dark:text-white">الورد اليومي</h3>
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400" dir="rtl">
              تم تسميع {todayAyahsCount} من أصل {memorizationPlan.dailyAyahs} آية
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-4">
            <div 
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, planProgress)}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            {planProgress >= 100 ? (
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                أحسنت! لقد أتممت وردك اليومي.
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                باقي {Math.max(0, memorizationPlan.dailyAyahs - todayAyahsCount)} آية لإتمام الورد
              </p>
            )}
            
            <Link 
              to={`/surah/${nextSurahToMemorize}`}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              متابعة الحفظ
            </Link>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white shadow-lg shadow-primary-500/20"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Flame className="text-primary-100" size={20} />
            <h3 className="font-medium text-primary-50">أيام المتابعة</h3>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold">{streakDays}</span>
            <span className="text-primary-100 text-sm">أيام</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Award className="text-amber-500" size={20} />
            <h3 className="font-medium text-slate-600 dark:text-slate-400">متوسط الدقة</h3>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{averageAccuracy}</span>
            <span className="text-slate-500 text-sm">%</span>
          </div>
        </motion.div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">إجراءات سريعة</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Link
            to="/memorize"
            className="flex items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-500 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center ms-4 group-hover:bg-primary-500 transition-colors">
              <BookOpen className="text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors" size={24} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white text-lg">ابدأ التسميع</h3>
              <p className="text-slate-500 text-sm">اختبر حفظك</p>
            </div>
          </Link>
          
          <a
            href="#/profile"
            onClick={(e) => handleOnlineRequiredClick(e, '/profile', { activeTab: 'rewards' })}
            className="flex items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center ms-4 group-hover:bg-amber-500 transition-colors">
              <Award className="text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" size={24} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white text-lg">المكافآت</h3>
              <p className="text-slate-500 text-sm">استبدل نقاطك بمكافآت</p>
            </div>
          </a>
        </div>
      </section>

      {recentTests.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">النشاط الأخير</h2>
            <Link to="/progress" className="text-primary-600 text-sm font-medium">عرض الكل</Link>
          </div>
          <div className="space-y-3">
            {recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Clock className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{test.surahName || `سورة ${test.surahNumber}`}</h4>
                    <p className="text-xs text-slate-500">الآيات {test.startAyah} - {test.endAyah}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${test.accuracy >= 90 ? 'text-primary-500' : test.accuracy >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                    {test.accuracy}%
                  </div>
                  <div className="text-xs text-slate-400">{new Date(test.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
