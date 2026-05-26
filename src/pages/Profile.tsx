import { useStore } from '../store/useStore';
import { Award, Star, Target, Settings, Palette, Type, Moon, Sun, Monitor, Flame, Trophy, Swords, Gift, Users, Edit2, User, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ACHIEVEMENTS } from '../data/achievements';
import { auth, onAuthStateChanged, signInWithGoogle } from '../firebase';
import { useNetwork } from '../hooks/useNetwork';
import OfflineDialog from '../components/OfflineDialog';

const LEVELS = [
  { name: 'مبتدئ', minPoints: 0 },
  { name: 'طالب علم', minPoints: 500 },
  { name: 'حافظ جزء', minPoints: 2000 },
  { name: 'حافظ 5 أجزاء', minPoints: 10000 },
  { name: 'حافظ نصف القرآن', minPoints: 30000 },
  { name: 'حافظ القرآن كاملًا', minPoints: 60000 },
];

export default function Profile() {
  const navigate = useNavigate();
  const { 
    points, 
    streakDays, 
    highestStreak,
    achievements, 
    themePreferences, 
    setThemePreferences, 
    memorizationPlan, 
    setMemorizationPlan,
    challenges,
    userProfile
  } = useStore();
  
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'challenges' | 'rewards'>(
    location.state?.activeTab || 'overview'
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);
  const isOnline = useNetwork();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.displayName === 'مستخدم' ? '' : userProfile.displayName);
      setEditGender(userProfile.gender);
      if (!userProfile.gender || userProfile.displayName === 'مستخدم') {
        setIsEditingProfile(true);
      }
    }
  }, [userProfile]);

  const handleSaveProfile = () => {
    if (editName.trim() && editGender) {
      const newProfile = {
        uid: auth.currentUser?.uid || userProfile?.uid || 'local-user',
        displayName: editName.trim(),
        gender: editGender,
        photoURL: auth.currentUser?.photoURL || userProfile?.photoURL || '',
        points: userProfile?.points || points,
        weeklyPoints: userProfile?.weeklyPoints || useStore.getState().weeklyPoints || 0,
        monthlyPoints: userProfile?.monthlyPoints || useStore.getState().monthlyPoints || 0,
        level: userProfile?.level || currentLevel.name,
        streakDays: userProfile?.streakDays || streakDays,
        highestStreak: userProfile?.highestStreak || highestStreak,
        lastActive: new Date().toISOString(),
        unlockedThemes: useStore.getState().unlockedThemes,
        unlockedTreeShapes: useStore.getState().unlockedTreeShapes,
      };
      
      useStore.getState().setUserProfile(newProfile);
      useStore.getState().syncUserProfileToFirebase();
      setIsEditingProfile(false);
    }
  };

  const currentLevel = LEVELS.slice().reverse().find(l => points >= l.minPoints) || LEVELS[0];
  const nextLevel = LEVELS.find(l => points < l.minPoints);
  const progressToNext = nextLevel ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 : 100;

  const renderRewards = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-500 mb-3">
          <Gift size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">المكافآت</h2>
        <p className="text-slate-500 dark:text-slate-400">
          استخدم نقاطك لفتح مكافآت جديدة
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">ألوان التطبيق</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'primary', name: 'الزمردي', cost: 0, color: 'bg-primary-500' },
            { id: 'blue', name: 'الأزرق', cost: 1000, color: 'bg-blue-500' },
            { id: 'purple', name: 'البنفسجي', cost: 2000, color: 'bg-purple-500' },
            { id: 'amber', name: 'الذهبي', cost: 5000, color: 'bg-amber-500' },
          ].map(theme => {
            const isUnlocked = useStore.getState().unlockedThemes?.includes(theme.id) || theme.cost === 0;
            return (
              <div key={theme.id} className={`p-4 rounded-2xl border ${isUnlocked ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-70'} flex flex-col items-center text-center gap-2`}>
                <div className={`w-10 h-10 rounded-full ${theme.color} shadow-sm`}></div>
                <h4 className="font-bold text-slate-900 dark:text-white">{theme.name}</h4>
                {isUnlocked ? (
                  <button 
                    onClick={() => setThemePreferences({ color: theme.id as any })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg w-full ${themePreferences.color === theme.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {themePreferences.color === theme.id ? 'مُفعل' : 'تفعيل'}
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (points >= theme.cost) {
                        useStore.getState().unlockTheme(theme.id, theme.cost);
                      }
                    }}
                    disabled={points < theme.cost}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg w-full flex items-center justify-center gap-1 ${points >= theme.cost ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                  >
                    <span>{theme.cost}</span>
                    <Star size={12} className="fill-current" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">أشكال شجرة الإنجاز</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'default', name: 'الشجرة الأساسية', cost: 0, icon: '🌳' },
            { id: 'palm', name: 'النخلة', cost: 3000, icon: '🌴' },
            { id: 'pine', name: 'الصنوبر', cost: 6000, icon: '🌲' },
            { id: 'sakura', name: 'زهرة الساكورا', cost: 10000, icon: '🌸' },
          ].map(tree => {
            const isUnlocked = useStore.getState().unlockedTreeShapes?.includes(tree.id) || tree.cost === 0;
            const isEquipped = false; // We don't have a state for equipped tree yet, but we can just show it as unlocked
            return (
              <div key={tree.id} className={`p-4 rounded-2xl border ${isUnlocked ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-70'} flex flex-col items-center text-center gap-2`}>
                <div className="text-4xl mb-2">{tree.icon}</div>
                <h4 className="font-bold text-slate-900 dark:text-white">{tree.name}</h4>
                {isUnlocked ? (
                  <div className="text-xs font-bold px-3 py-1.5 rounded-lg w-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    مفتوح
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      if (points >= tree.cost) {
                        useStore.getState().unlockTreeShape(tree.id, tree.cost);
                      }
                    }}
                    disabled={points < tree.cost}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg w-full flex items-center justify-center gap-1 ${points >= tree.cost ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                  >
                    <span>{tree.cost}</span>
                    <Star size={12} className="fill-current" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

// ... inside Profile component
  const handleGoogleSignIn = async () => {
    if (!isOnline) {
      setShowOfflineDialog(true);
      return;
    }
    try {
      await signInWithGoogle();
      // The onAuthStateChanged listener in App.tsx will handle the rest
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const renderProfileSetup = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-500 mb-4">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">إعداد الملف الشخصي</h2>
        <p className="text-slate-500 dark:text-slate-400">سجل دخولك لحفظ تقدمك والمنافسة في لوحة الصدارة</p>
      </div>

      <div className="space-y-4">
        {!isAuthenticated && (
          <button 
            onClick={handleGoogleSignIn}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            تسجيل الدخول باستخدام جوجل
          </button>
        )}

        {isAuthenticated && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الاسم الثنائي
              </label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الجنس
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setEditGender('male')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${editGender === 'male' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <UserCircle2 size={32} className={editGender === 'male' ? 'text-blue-500' : ''} />
                  <span className="font-bold">ذكر</span>
                </button>
                <button
                  onClick={() => setEditGender('female')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${editGender === 'female' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <UserCircle2 size={32} className={editGender === 'female' ? 'text-pink-500' : ''} />
                  <span className="font-bold">أنثى</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={!editName.trim() || !editGender}
              className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              حفظ البيانات
            </button>
          </>
        )}
      </div>
    </motion.div>
  );

  const renderOverview = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <section className="bg-gradient-to-br from-primary-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-100 text-sm font-medium mb-1">المستوى الحالي</p>
            <h2 className="text-3xl font-bold">{currentLevel.name}</h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Award size={32} className="text-white" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{points} نقطة</span>
            {nextLevel && <span className="text-primary-100">باقي {nextLevel.minPoints - points} للترقية</span>}
          </div>
          <div className="h-3 bg-black/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-white rounded-full"
            ></motion.div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">سلسلة الأيام</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{streakDays} <span className="text-sm font-normal text-slate-500">يوم</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">أعلى سلسلة</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{highestStreak} <span className="text-sm font-normal text-slate-500">يوم</span></p>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Target size={24} className="text-primary-500" />
            خطة الحفظ
          </h2>
        </div>
        
        {memorizationPlan ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {memorizationPlan.type === 'ramadan' ? 'تحدي رمضان 🌙' : 
                 memorizationPlan.type === '1_year' ? 'خطة سنة واحدة' : 
                 memorizationPlan.type === '2_years' ? 'خطة سنتين' : 'خطة مخصصة'}
              </h3>
              <button onClick={() => setMemorizationPlan(null)} className="text-sm text-red-500 hover:underline">إلغاء</button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">الورد اليومي</p>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{memorizationPlan.dailyAyahs} آية</p>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">تاريخ البدء</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{new Date(memorizationPlan.startDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setMemorizationPlan({ type: 'ramadan', startDate: new Date().toISOString(), dailyAyahs: 20, totalAyahsTarget: 6236 })}
              className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 text-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <div className="text-2xl mb-2">🌙</div>
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">تحدي رمضان</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">ختم القرآن في شهر</p>
            </button>
            <button 
              onClick={() => setMemorizationPlan({ type: '1_year', startDate: new Date().toISOString(), dailyAyahs: 17, totalAyahsTarget: 6236 })}
              className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl p-4 text-center hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            >
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-bold text-primary-900 dark:text-primary-300 mb-1">خطة سنة</h3>
              <p className="text-xs text-primary-600 dark:text-primary-400">حفظ 17 آية يومياً</p>
            </button>
          </div>
        )}
      </section>
    </motion.div>
  );

  const renderAchievements = () => {
    const categories = Array.from(new Set(ACHIEVEMENTS.map(a => a.category)));
    const safeAchievements = achievements || [];
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 mb-3">
            <Star size={32} className="fill-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">الإنجازات</h2>
          <p className="text-slate-500 dark:text-slate-400">
            لقد حققت {safeAchievements.length} من أصل {ACHIEVEMENTS.length} إنجاز
          </p>
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full" 
              style={{ width: `${(safeAchievements.length / ACHIEVEMENTS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {categories.map(category => {
          const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
          const categoryName = category === 'memorization' ? 'الحفظ' : category === 'streak' ? 'الاستمرارية' : 'التسميع والاختبارات';
          
          return (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{categoryName}</h3>
              <div className="grid grid-cols-2 gap-4">
                {categoryAchievements.map(ach => {
                  const isUnlocked = safeAchievements.includes(ach.id);
                  return (
                    <div 
                      key={ach.id} 
                      className={`p-4 rounded-2xl border transition-all ${isUnlocked ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60 grayscale'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isUnlocked ? ach.color : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                        <ach.icon size={24} />
                      </div>
                      <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{ach.title}</h3>
                      <p className="text-xs text-slate-500">{ach.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-24">
      <OfflineDialog isOpen={showOfflineDialog} onClose={() => setShowOfflineDialog(false)} />
      <header className="pt-4 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {userProfile && !isEditingProfile && (
            userProfile.photoURL ? (
              <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-sm" referrerPolicy="no-referrer" />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm ${userProfile.gender === 'female' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'}`}>
                <User size={32} />
              </div>
            )
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {userProfile && !isEditingProfile ? userProfile.displayName : 'الملف الشخصي'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">تابع إنجازاتك ومستواك</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className={`p-3 rounded-full shadow-sm border transition-colors ${isEditingProfile ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-600'}`}
            title="تعديل الملف الشخصي"
          >
            <Edit2 size={24} />
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className={`p-3 rounded-full shadow-sm border transition-colors ${showSettings ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-600'}`}
            title="الإعدادات"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isEditingProfile ? (
          <motion.div key="setup">{renderProfileSetup()}</motion.div>
        ) : (
          <>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6 overflow-x-auto hide-scrollbar">
              {[
                { id: 'overview', label: 'نظرة عامة' },
                { id: 'achievements', label: 'الإنجازات' },
                { id: 'rewards', label: 'المكافآت' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && <motion.div key="overview">{renderOverview()}</motion.div>}
              {activeTab === 'achievements' && <motion.div key="achievements">{renderAchievements()}</motion.div>}
              {activeTab === 'rewards' && <motion.div key="rewards">{renderRewards()}</motion.div>}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
