import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Gift, Users, UserPlus, CheckCircle2, Search, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { fetchSurahs, Surah } from '../utils/quranApi';
import { useNetwork } from '../hooks/useNetwork';
import OfflineDialog from '../components/OfflineDialog';

export default function Challenges() {
  const { challenges, friendChallenges, userProfile, sendFriendChallenge, updateFriendChallengeStatus } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'daily' | 'friends'>('daily');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const isOnline = useNetwork();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  
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

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    if (!isOnline) {
      setShowOfflineDialog(true);
      return;
    }
    
    setIsSearching(true);
    try {
      // Simple search by displayName (Note: Firebase doesn't support full-text search natively, 
      // so this is a basic prefix match or exact match depending on setup. For simplicity, we fetch all and filter client-side if small, 
      // or just do a basic query)
      const q = query(collection(db, 'users'), limit(20));
      const querySnapshot = await getDocs(q);
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          doc.id !== auth.currentUser?.uid && 
          data.displayName && 
          data.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          users.push({ uid: doc.id, ...data });
        }
      });
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-24">
      <OfflineDialog isOpen={showOfflineDialog} onClose={() => setShowOfflineDialog(false)} />
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">التحديات</h1>
        <p className="text-slate-500 dark:text-slate-400">أكمل التحديات اليومية وتحدى أصدقائك</p>
      </header>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'daily' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          المهام اليومية
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'friends' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          تحديات الأصدقاء
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'daily' && (
          <motion.div 
            key="daily"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {challenges.map(challenge => (
              <div key={challenge.id} className={`p-5 rounded-3xl border ${challenge.completed ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} shadow-sm relative overflow-hidden`}>
                {challenge.completed && (
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/10 rounded-full blur-xl"></div>
                )}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${challenge.type === 'daily' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                        {challenge.type === 'daily' ? 'يومي' : 'أسبوعي'}
                      </span>
                      {challenge.completed && (
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                          مكتمل
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{challenge.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl">
                    <Gift size={16} />
                    <span className="text-sm font-bold">{challenge.reward}</span>
                  </div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                    <span>التقدم</span>
                    <span>{challenge.progress} / {challenge.target}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                      className={`h-full rounded-full ${challenge.completed ? 'bg-primary-500' : 'bg-indigo-500'}`}
                    ></motion.div>
                  </div>
                </div>
              </div>
            ))}
            {challenges.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                لا توجد تحديات حالية.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'friends' && (
          <motion.div 
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!userProfile ? (
              <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Users size={48} className="mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">سجل الدخول لتحدي أصدقائك</h3>
                <p className="text-slate-500 mb-4">يجب عليك إعداد ملفك الشخصي أولاً لتتمكن من إرسال واستقبال التحديات.</p>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-indigo-500" />
                    ابحث عن أصدقاء
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="ابحث بالاسم..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleSearchUsers}
                      disabled={isSearching || !searchQuery.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold transition-colors"
                    >
                      {isSearching ? 'جاري البحث...' : 'بحث'}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      {searchResults.map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                                <User size={20} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{user.displayName}</div>
                              <div className="text-xs text-slate-500">المستوى: {user.level || 'مبتدئ'}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setChallengeModal({ isOpen: true, userId: user.uid, userName: user.displayName, target: '10', type: 'ayahs' })}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
                          >
                            تحدي
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Swords size={20} className="text-orange-500" />
                    التحديات الحالية
                  </h3>
                  
                  {friendChallenges.map(challenge => (
                    <div key={challenge.id} className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                              تحدي صديق
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${challenge.status === 'pending' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : challenge.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'}`}>
                              {challenge.status === 'pending' ? 'في الانتظار' : challenge.status === 'completed' ? 'مكتمل' : 'مقبول'}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {challenge.type === 'ayahs' ? `حفظ ${challenge.target} آيات` : `تسميع ${challenge.target} سورة`}
                            {challenge.surahNumber && surahs.find(s => s.number === challenge.surahNumber) && ` (سورة ${surahs.find(s => s.number === challenge.surahNumber)?.name}${challenge.startAyah && challenge.endAyah ? ` من آية ${challenge.startAyah} إلى ${challenge.endAyah}` : ''})`}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {challenge.senderId === auth.currentUser?.uid ? `إلى: ${challenge.receiverName || 'صديق'}` : `من: ${challenge.senderName}`}
                          </p>
                        </div>
                      </div>
                      {(challenge.status === 'accepted' || challenge.status === 'completed') && (
                        <div className="relative z-10 mt-2">
                          <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                            <span>التقدم</span>
                            <span>{challenge.progress || 0} / {challenge.target}</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${((challenge.progress || 0) / challenge.target) * 100}%` }}
                              className={`h-full rounded-full ${challenge.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`}
                            ></motion.div>
                          </div>
                          {challenge.status === 'accepted' && challenge.receiverId === auth.currentUser?.uid && (
                            <button 
                              onClick={() => navigate(challenge.type === 'ayahs' ? '/memorize' : '/setup-test')} 
                              className="mt-4 w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 py-2 rounded-xl font-bold transition-colors"
                            >
                              ابدأ التحدي
                            </button>
                          )}
                        </div>
                      )}
                      {challenge.status === 'pending' && challenge.receiverId === auth.currentUser?.uid && (
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => {
                              if (!isOnline) {
                                setShowOfflineDialog(true);
                                return;
                              }
                              updateFriendChallengeStatus(challenge.id, 'accepted');
                            }}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-xl transition-colors"
                          >
                            قبول
                          </button>
                          <button 
                            onClick={() => {
                              if (!isOnline) {
                                setShowOfflineDialog(true);
                                return;
                              }
                              updateFriendChallengeStatus(challenge.id, 'declined');
                            }}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-xl transition-colors"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {friendChallenges.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      لا توجد تحديات من الأصدقاء حالياً.
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                تحدى <span className="font-bold">{challengeModal.userName}</span> في حفظ القرآن الكريم.
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
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      if (!isOnline) {
                        setShowOfflineDialog(true);
                        return;
                      }
                      if (challengeModal.userId && !isNaN(Number(challengeModal.target))) {
                        // If specific ayahs are selected, target should match the number of ayahs
                        let finalTarget = Number(challengeModal.target);
                        if (challengeModal.type === 'ayahs' && challengeModal.surahNumber && challengeModal.startAyah && challengeModal.endAyah) {
                          finalTarget = challengeModal.endAyah - challengeModal.startAyah + 1;
                        }
                        
                        sendFriendChallenge(
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
    </div>
  );
}
