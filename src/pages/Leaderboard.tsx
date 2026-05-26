import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, User, Trophy, Medal, Crown, Swords, UserCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth, signInWithGoogle, onAuthStateChanged } from '../firebase';
import { useNetwork } from '../hooks/useNetwork';
import OfflineDialog from '../components/OfflineDialog';

import { fetchSurahs, Surah } from '../utils/quranApi';

export default function Leaderboard() {
  const { userProfile } = useStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [loading, setLoading] = useState(true);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  
  useEffect(() => {
    fetchSurahs().then(setSurahs).catch(console.error);
  }, []);

  const [challengeModal, setChallengeModal] = useState<{ 
    isOpen: boolean, 
    userId: string | null, 
    userName: string, 
    target: string,
    type: 'ayahs' | 'test',
    surahNumber?: number,
    startAyah?: number,
    endAyah?: number
  }>({ 
    isOpen: false, 
    userId: null, 
    userName: '', 
    target: '10',
    type: 'ayahs'
  });

  const [error, setError] = useState<string | null>(null);
  
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);
  const isOnline = useNetwork();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);

  useEffect(() => {
    const checkSetup = (authenticated: boolean) => {
      if (!userProfile || userProfile.displayName === 'مستخدم' || !userProfile.gender || !authenticated) {
        setShowProfileSetup(true);
      } else {
        setShowProfileSetup(false);
      }
    };

    // Check initially and whenever userProfile changes
    checkSetup(isAuthenticated);

    // Also listen to auth state changes to re-evaluate
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAuth = !!user;
      setIsAuthenticated(isAuth);
      checkSetup(isAuth);
    });

    return () => unsubscribe();
  }, [userProfile, isAuthenticated]);

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

  const handleSaveProfile = () => {
    if (editName.trim() && editGender) {
      const newProfile = {
        uid: auth.currentUser?.uid || userProfile?.uid || 'local-user',
        displayName: editName.trim(),
        gender: editGender,
        photoURL: auth.currentUser?.photoURL || userProfile?.photoURL || '',
        points: userProfile?.points || useStore.getState().points || 0,
        weeklyPoints: userProfile?.weeklyPoints || useStore.getState().weeklyPoints || 0,
        monthlyPoints: userProfile?.monthlyPoints || useStore.getState().monthlyPoints || 0,
        level: userProfile?.level || 'مبتدئ',
        streakDays: userProfile?.streakDays || useStore.getState().streakDays || 0,
        highestStreak: userProfile?.highestStreak || useStore.getState().highestStreak || 0,
        lastActive: new Date().toISOString(),
        unlockedThemes: useStore.getState().unlockedThemes,
        unlockedTreeShapes: useStore.getState().unlockedTreeShapes,
      };
      
      useStore.getState().setUserProfile(newProfile);
      useStore.getState().syncUserProfileToFirebase();
      setShowProfileSetup(false);
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!userProfile) {
        setLoading(false);
        setError('يرجى إعداد ملفك الشخصي أولاً.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let orderByField = 'points';
        if (leaderboardTimeframe === 'monthly') orderByField = 'monthlyPoints';
        if (leaderboardTimeframe === 'weekly') orderByField = 'weeklyPoints';

        const q = query(collection(db, 'users'), orderBy(orderByField, 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setLeaderboard(users);
      } catch (err: any) {
        console.error("Error fetching leaderboard:", err);
        if (err.code === 'permission-denied') {
          setError("لا تملك الصلاحية لعرض لوحة الصدارة. تأكد من تفعيل تسجيل الدخول المجهول.");
        } else {
          setError("حدث خطأ أثناء جلب لوحة الصدارة.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [leaderboardTimeframe, userProfile]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-24">
      <OfflineDialog isOpen={showOfflineDialog} onClose={() => setShowOfflineDialog(false)} />
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">لوحة الصدارة</h1>
        <p className="text-slate-500 dark:text-slate-400">تنافس مع أصدقائك وحفاظ القرآن</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setLeaderboardTimeframe('all')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${leaderboardTimeframe === 'all' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setLeaderboardTimeframe('monthly')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${leaderboardTimeframe === 'monthly' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              هذا الشهر
            </button>
            <button 
              onClick={() => setLeaderboardTimeframe('weekly')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${leaderboardTimeframe === 'weekly' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              هذا الأسبوع
            </button>
          </div>
          
          <div className="p-2">
            {error ? (
              <div className="text-center py-12 text-red-500 flex flex-col items-center gap-3 px-4">
                <p>{error}</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p>جاري تحميل لوحة الصدارة...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                لا يوجد بيانات لعرضها حالياً
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((user, index) => (
                  <div 
                    key={user.uid} 
                    className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                      user.uid === userProfile?.uid 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${
                        index === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900' : 
                        index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800' : 
                        index === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900' : 
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {index === 0 ? <Crown size={20} /> : 
                         index === 1 ? <Medal size={20} /> : 
                         index === 2 ? <Medal size={20} /> : 
                         index + 1}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" referrerPolicy="no-referrer" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm ${
                            user.gender === 'female' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                          }`}>
                            <User size={24} />
                          </div>
                        )}
                        <div>
                          <div className={`font-bold text-base ${user.uid === userProfile?.uid ? 'text-primary-700 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>
                            {user.displayName || 'مستخدم'} {user.uid === userProfile?.uid && <span className="text-xs font-normal text-primary-500 bg-primary-100 dark:bg-primary-900/50 px-2 py-0.5 rounded-full mr-2">(أنت)</span>}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            المستوى: {user.level || 'مبتدئ'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-center">
                      <div className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-1">
                        {leaderboardTimeframe === 'weekly' ? (user.weeklyPoints || 0) : leaderboardTimeframe === 'monthly' ? (user.monthlyPoints || 0) : (user.points || 0)}
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">نقطة</span>
                      {user.uid !== userProfile?.uid && (
                        <button 
                          onClick={() => setChallengeModal({ isOpen: true, userId: user.uid, userName: user.displayName || 'صديق', target: '10', type: 'ayahs' })}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
                        >
                          تحدي
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {challengeModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
                <Swords size={24} />
                <h3 className="text-xl font-bold">إرسال تحدي</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                أرسل تحدي حفظ لـ {challengeModal.userName}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    نوع التحدي
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChallengeModal({ ...challengeModal, type: 'ayahs' })}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${challengeModal.type === 'ayahs' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                    >
                      آيات
                    </button>
                    <button
                      onClick={() => setChallengeModal({ ...challengeModal, type: 'test' })}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${challengeModal.type === 'test' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                    >
                      سور
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      السورة (اختياري)
                    </label>
                    <select
                      value={challengeModal.surahNumber || ''}
                      onChange={(e) => {
                        const surahNumber = e.target.value ? Number(e.target.value) : undefined;
                        setChallengeModal({ ...challengeModal, surahNumber, startAyah: undefined, endAyah: undefined });
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">أي سورة</option>
                      {surahs.map(surah => (
                        <option key={surah.number} value={surah.number}>
                          {surah.number}. {surah.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {challengeModal.type === 'ayahs' && challengeModal.surahNumber && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          من آية (اختياري)
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          max={surahs.find(s => s.number === challengeModal.surahNumber)?.numberOfAyahs || 286}
                          value={challengeModal.startAyah || ''}
                          onChange={(e) => setChallengeModal({ ...challengeModal, startAyah: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          إلى آية (اختياري)
                        </label>
                        <input 
                          type="number" 
                          min={challengeModal.startAyah || 1}
                          max={surahs.find(s => s.number === challengeModal.surahNumber)?.numberOfAyahs || 286}
                          value={challengeModal.endAyah || ''}
                          onChange={(e) => setChallengeModal({ ...challengeModal, endAyah: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    العدد المستهدف
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    value={challengeModal.target}
                    onChange={(e) => setChallengeModal({ ...challengeModal, target: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      if (challengeModal.userId && !isNaN(Number(challengeModal.target))) {
                        let finalTarget = Number(challengeModal.target);
                        if (challengeModal.type === 'ayahs' && challengeModal.surahNumber && challengeModal.startAyah && challengeModal.endAyah) {
                          finalTarget = challengeModal.endAyah - challengeModal.startAyah + 1;
                        }

                        useStore.getState().sendFriendChallenge(
                          challengeModal.userId, 
                          challengeModal.userName, 
                          challengeModal.type, 
                          finalTarget,
                          challengeModal.surahNumber,
                          challengeModal.startAyah,
                          challengeModal.endAyah
                        );
                        setChallengeModal({ isOpen: false, userId: null, userName: '', target: '10', type: 'ayahs' });
                      }
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    إرسال
                  </button>
                  <button 
                    onClick={() => setChallengeModal({ isOpen: false, userId: null, userName: '', target: '10', type: 'ayahs' })}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProfileSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-500 mb-4">
                  <User size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">تسجيل الدخول</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">أدخل بياناتك للمشاركة في لوحة الصدارة</p>
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
                      حفظ معلومات الدخول
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
