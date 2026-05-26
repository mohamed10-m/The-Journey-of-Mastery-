import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth, doc, setDoc, updateDoc, onSnapshot, collection, query, where, orderBy, limit, getDocs, or, and } from '../firebase';

export interface TestResult {
  id: string;
  date: string;
  surahNumber: number;
  surahName?: string;
  startAyah: number;
  endAyah: number;
  accuracy: number;
  correctWords: number;
  mistakes: number;
  missingWords: number;
}

export interface MemorizationPlan {
  type: '1_year' | '2_years' | '3_years' | 'ramadan' | 'custom';
  startDate: string;
  dailyAyahs: number;
  totalAyahsTarget: number;
}

export interface ThemePreferences {
  font: 'amiri' | 'hafs' | 'uthmani';
  color: 'primary' | 'blue' | 'purple' | 'amber';
  darkMode: 'light' | 'dark' | 'system';
  fontSize: number;
}

export interface Challenge {
  id: string;
  type: 'daily' | 'weekly' | 'friend';
  title: string;
  target: number;
  progress: number;
  completed: boolean;
  expiresAt: string;
  reward: string;
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  photoURL: string;
  gender?: 'male' | 'female';
  points: number;
  weeklyPoints?: number;
  monthlyPoints?: number;
  level: string;
  streakDays: number;
  highestStreak: number;
  lastActive: string;
  unlockedThemes?: string[];
  unlockedTreeShapes?: string[];
}

export interface FriendChallenge {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName?: string;
  type: 'ayahs' | 'test';
  target: number;
  surahNumber?: number;
  startAyah?: number;
  endAyah?: number;
  progress?: number;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  createdAt: string;
  expiresAt: string;
}

interface AppState {
  memorizedSurahs: number[];
  testHistory: TestResult[];
  streakDays: number;
  highestStreak: number;
  lastTestDate: string | null;
  lastWeeklyReset: string | null;
  lastMonthlyReset: string | null;
  points: number;
  weeklyPoints: number;
  monthlyPoints: number;
  achievements: string[];
  memorizationPlan: MemorizationPlan | null;
  themePreferences: ThemePreferences;
  challenges: Challenge[];
  unlockedThemes: string[];
  unlockedTreeShapes: string[];
  userProfile: UserProfile | null;
  leaderboard: UserProfile[];
  friendChallenges: FriendChallenge[];
  hasResetV2?: boolean;
  
  performV2Reset: () => void;
  addMemorizedSurah: (surahNumber: number) => void;
  removeMemorizedSurah: (surahNumber: number) => void;
  addTestResult: (result: TestResult) => void;
  addPoints: (points: number) => void;
  unlockAchievement: (id: string) => void;
  unlockTheme: (themeId: string, cost: number) => void;
  unlockTreeShape: (treeId: string, cost: number) => void;
  setMemorizationPlan: (plan: MemorizationPlan | null) => void;
  setThemePreferences: (prefs: Partial<ThemePreferences>) => void;
  generateDailyChallenges: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
  syncUserProfileToFirebase: () => Promise<void>;
  fetchLeaderboard: (timeframe?: 'all' | 'weekly' | 'monthly') => Promise<void>;
  sendFriendChallenge: (receiverId: string, receiverName: string, type: 'ayahs' | 'test', target: number, surahNumber?: number, startAyah?: number, endAyah?: number) => Promise<void>;
  updateFriendChallengeStatus: (challengeId: string, status: 'accepted' | 'completed' | 'declined') => Promise<void>;
  listenToFriendChallenges: () => () => void;
  checkAndResetTimeframes: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      memorizedSurahs: [],
      testHistory: [],
      streakDays: 0,
      highestStreak: 0,
      lastTestDate: null,
      lastWeeklyReset: null,
      lastMonthlyReset: null,
      points: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      achievements: [],
      unlockedThemes: ['primary'],
      memorizationPlan: null,
      themePreferences: {
        font: 'amiri',
        color: 'primary',
        darkMode: 'system',
        fontSize: 36,
      },
      challenges: [],
      unlockedTreeShapes: ['default'],
      userProfile: null,
      leaderboard: [],
      friendChallenges: [],
      hasResetV2: false,

      performV2Reset: () => {
        set({
          points: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          achievements: [],
          challenges: [],
          streakDays: 0,
          highestStreak: 0,
          hasResetV2: true,
        });
        get().generateDailyChallenges();
        get().syncUserProfileToFirebase();
      },

      setUserProfile: (profile) => set({ userProfile: profile }),

      checkAndResetTimeframes: () => {
        set((state) => {
          const now = new Date();
          const getWeekNumber = (d: Date) => {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
            return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
          };
          const currentWeek = `${now.getFullYear()}-W${getWeekNumber(now)}`;
          const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

          let newWeeklyPoints = state.weeklyPoints || 0;
          let newMonthlyPoints = state.monthlyPoints || 0;
          let changed = false;

          if (state.lastWeeklyReset !== currentWeek) {
            newWeeklyPoints = 0;
            changed = true;
          }
          if (state.lastMonthlyReset !== currentMonth) {
            newMonthlyPoints = 0;
            changed = true;
          }

          if (changed) {
            return {
              weeklyPoints: newWeeklyPoints,
              monthlyPoints: newMonthlyPoints,
              lastWeeklyReset: currentWeek,
              lastMonthlyReset: currentMonth
            };
          }
          return state;
        });
      },

      syncUserProfileToFirebase: async () => {
        const state = get();
        const user = auth.currentUser;
        if (!user) return;

        const currentProfile = state.userProfile;

        const profileData: any = {
          uid: user.uid,
          displayName: currentProfile?.displayName || 'مستخدم',
          photoURL: currentProfile?.photoURL || '',
          points: state.points,
          weeklyPoints: state.weeklyPoints || 0,
          monthlyPoints: state.monthlyPoints || 0,
          level: 'مبتدئ', // Simplify for now, ideally calculate based on points
          streakDays: state.streakDays,
          highestStreak: state.highestStreak,
          lastActive: new Date().toISOString(),
          unlockedThemes: state.unlockedThemes,
          unlockedTreeShapes: state.unlockedTreeShapes,
          hasResetV2: state.hasResetV2 || false,
        };

        if (currentProfile?.gender) {
          profileData.gender = currentProfile.gender;
        }

        try {
          await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
          set({ userProfile: profileData as UserProfile });
        } catch (error) {
          console.error("Error syncing profile to Firebase:", error);
        }
      },

      fetchLeaderboard: async (timeframe = 'all') => {
        try {
          let orderByField = 'points';
          if (timeframe === 'weekly') orderByField = 'weeklyPoints';
          if (timeframe === 'monthly') orderByField = 'monthlyPoints';

          const q = query(collection(db, 'users'), orderBy(orderByField, 'desc'), limit(10));
          const querySnapshot = await getDocs(q);
          const leaderboardData: UserProfile[] = [];
          querySnapshot.forEach((doc) => {
            leaderboardData.push(doc.data() as UserProfile);
          });
          set({ leaderboard: leaderboardData });
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
        }
      },

      sendFriendChallenge: async (receiverId, receiverName, type, target, surahNumber, startAyah, endAyah) => {
        const user = auth.currentUser;
        if (!user) return;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours

        const challengeData = {
          senderId: user.uid,
          senderName: user.displayName || 'صديق',
          receiverId,
          receiverName,
          type,
          target,
          progress: 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          surahNumber,
          startAyah,
          endAyah
        };

        try {
          const newDocRef = doc(collection(db, 'friendChallenges'));
          await setDoc(newDocRef, challengeData);
        } catch (error) {
          console.error("Error sending challenge:", error);
        }
      },

      updateFriendChallengeStatus: async (challengeId, status) => {
        try {
          await updateDoc(doc(db, 'friendChallenges', challengeId), { status });
        } catch (error) {
          console.error("Error updating challenge status:", error);
        }
      },

      listenToFriendChallenges: () => {
        const user = auth.currentUser;
        if (!user) return () => {};

        const q = query(
          collection(db, 'friendChallenges'),
          and(
            or(
              where('receiverId', '==', user.uid),
              where('senderId', '==', user.uid)
            ),
            where('status', 'in', ['pending', 'accepted', 'completed'])
          )
        );

        return onSnapshot(q, (snapshot) => {
          const challenges: FriendChallenge[] = [];
          snapshot.forEach((doc) => {
            challenges.push({ id: doc.id, ...doc.data() } as FriendChallenge);
          });
          set({ friendChallenges: challenges });
        });
      },

      addMemorizedSurah: (surahNumber) =>
        set((state) => {
          const newMemorized = state.memorizedSurahs.includes(surahNumber)
            ? state.memorizedSurahs
            : [...state.memorizedSurahs, surahNumber];
          
          // Check achievements
          const newAchievements = [...state.achievements];
          if (!newAchievements.includes('mem_1_surah') && newMemorized.length >= 1) {
            newAchievements.push('mem_1_surah');
          }
          if (!newAchievements.includes('mem_1_juz') && newMemorized.length >= 10) { // Rough estimate
            newAchievements.push('mem_1_juz');
          }

          return {
            memorizedSurahs: newMemorized,
            achievements: newAchievements,
          };
        }),

      removeMemorizedSurah: (surahNumber) =>
        set((state) => ({
          memorizedSurahs: state.memorizedSurahs.filter((n) => n !== surahNumber),
        })),

      addTestResult: (result) => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          let newStreak = state.streakDays;
          let newHighestStreak = state.highestStreak;

          if (state.lastTestDate !== today) {
            if (state.lastTestDate) {
              const lastDate = new Date(state.lastTestDate);
              const currentDate = new Date(today);
              const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                newStreak += 1;
              } else if (diffDays > 1) {
                newStreak = 1;
              }
            } else {
              newStreak = 1;
            }
            if (newStreak > newHighestStreak) {
              newHighestStreak = newStreak;
            }
          }

          // Calculate points: 1 point per ayah. Bonus if accuracy >= 80%.
          const totalAyahs = result.endAyah - result.startAyah + 1;
          const basePoints = totalAyahs;
          let bonusPoints = 0;
          if (result.accuracy >= 80) {
            // Bonus is up to 50% of base points.
            bonusPoints = Math.round(basePoints * 0.5 * (result.accuracy / 100));
          }
          const earnedPoints = basePoints + bonusPoints;
          
          const newTestHistory = [result, ...state.testHistory];
          const now = new Date();
          const getWeekNumber = (d: Date) => {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
            return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
          };
          const currentWeek = `${now.getFullYear()}-W${getWeekNumber(now)}`;
          const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

          let newWeeklyPoints = state.weeklyPoints || 0;
          let newMonthlyPoints = state.monthlyPoints || 0;

          if (state.lastWeeklyReset !== currentWeek) {
            newWeeklyPoints = 0;
          }
          if (state.lastMonthlyReset !== currentMonth) {
            newMonthlyPoints = 0;
          }

          let newPoints = state.points + earnedPoints;
          newWeeklyPoints += earnedPoints;
          newMonthlyPoints += earnedPoints;
          const newAchievements = [...state.achievements];
          
          // Check achievements
          if (!newAchievements.includes('mem_1_ayah') && newTestHistory.length > 0) {
            newAchievements.push('mem_1_ayah');
          }
          if (!newAchievements.includes('mem_1_page') && totalAyahs >= 15) {
            newAchievements.push('mem_1_page');
          }
          
          const uniqueAyahsMemorized = new Set<string>();
          newTestHistory.forEach(test => {
            for (let i = test.startAyah; i <= test.endAyah; i++) {
              uniqueAyahsMemorized.add(`${test.surahNumber}:${i}`);
            }
          });
          const totalUniqueAyahs = uniqueAyahsMemorized.size;
          
          if (!newAchievements.includes('mem_50_ayah') && totalUniqueAyahs >= 50) newAchievements.push('mem_50_ayah');
          if (!newAchievements.includes('mem_100_ayah') && totalUniqueAyahs >= 100) newAchievements.push('mem_100_ayah');
          if (!newAchievements.includes('mem_500_ayah') && totalUniqueAyahs >= 500) newAchievements.push('mem_500_ayah');
          
          if (!newAchievements.includes('streak_3') && newStreak >= 3) newAchievements.push('streak_3');
          if (!newAchievements.includes('streak_7') && newStreak >= 7) newAchievements.push('streak_7');
          if (!newAchievements.includes('streak_30') && newStreak >= 30) newAchievements.push('streak_30');
          if (!newAchievements.includes('streak_100') && newStreak >= 100) newAchievements.push('streak_100');

          if (!newAchievements.includes('test_1') && newTestHistory.length >= 1) newAchievements.push('test_1');
          if (!newAchievements.includes('test_10') && newTestHistory.length >= 10) newAchievements.push('test_10');
          if (!newAchievements.includes('test_50') && newTestHistory.length >= 50) newAchievements.push('test_50');
          if (!newAchievements.includes('test_100') && newTestHistory.length >= 100) newAchievements.push('test_100');

          // Update challenges
          let additionalPoints = 0;
          
          const testAyahs = new Set<string>();
          for (let i = result.startAyah; i <= result.endAyah; i++) {
            testAyahs.add(`${result.surahNumber}:${i}`);
          }

          const newChallenges = state.challenges.map(c => {
            if (c.completed) return c;
            
            let newProgress = c.progress;
            if (c.id.includes('ayahs')) {
              const challengeStart = c.createdAt || c.id.split('_').pop() || '';
              const relevantHistory = state.testHistory.filter(h => h.date >= challengeStart);
              const previouslyTestedAyahs = new Set<string>();
              relevantHistory.forEach(test => {
                for (let i = test.startAyah; i <= test.endAyah; i++) {
                  previouslyTestedAyahs.add(`${test.surahNumber}:${i}`);
                }
              });
              
              let newUnique = 0;
              testAyahs.forEach(ayah => {
                if (!previouslyTestedAyahs.has(ayah)) newUnique++;
              });
              newProgress += newUnique;
            } else if (c.id.includes('test')) {
              newProgress += 1;
            }
            
            const isNowCompleted = newProgress >= c.target;
            if (isNowCompleted) {
              if (c.reward.includes('نقطة')) {
                additionalPoints += parseInt(c.reward) || 0;
              } else if (c.reward.includes('لون')) {
                additionalPoints += 100; // Fallback reward
              }
            }

            return {
              ...c,
              progress: Math.min(newProgress, c.target),
              completed: isNowCompleted
            };
          });

          newPoints += additionalPoints;
          newWeeklyPoints += additionalPoints;
          newMonthlyPoints += additionalPoints;

          // Update friend challenges
          const user = auth.currentUser;
          if (user) {
            state.friendChallenges.forEach(async (fc) => {
              if (fc.status === 'accepted' && fc.receiverId === user.uid) {
                let newProgress = fc.progress || 0;
                if (fc.type === 'ayahs') {
                  // Check if the challenge specifies a Surah and Ayahs
                  if (fc.surahNumber !== undefined) {
                    if (result.surahNumber === fc.surahNumber) {
                      // Calculate overlap between tested ayahs and challenge ayahs
                      const challengeStart = fc.startAyah || 1;
                      const challengeEnd = fc.endAyah || 286; // Max possible ayahs
                      
                      const overlapStart = Math.max(result.startAyah, challengeStart);
                      const overlapEnd = Math.min(result.endAyah, challengeEnd);
                      
                      if (overlapStart <= overlapEnd) {
                        // Check uniqueness
                        const challengeStartStr = fc.createdAt || '';
                        const relevantHistory = state.testHistory.filter(h => h.date >= challengeStartStr && h.surahNumber === fc.surahNumber);
                        const previouslyTestedAyahs = new Set<number>();
                        relevantHistory.forEach(test => {
                          for (let i = test.startAyah; i <= test.endAyah; i++) {
                            previouslyTestedAyahs.add(i);
                          }
                        });
                        
                        let newUnique = 0;
                        for (let i = overlapStart; i <= overlapEnd; i++) {
                          if (!previouslyTestedAyahs.has(i)) newUnique++;
                        }
                        newProgress += newUnique;
                      }
                    }
                  } else {
                    // Fallback to total unique ayahs if no specific surah
                    const challengeStartStr = fc.createdAt || '';
                    const relevantHistory = state.testHistory.filter(h => h.date >= challengeStartStr);
                    const previouslyTestedAyahs = new Set<string>();
                    relevantHistory.forEach(test => {
                      for (let i = test.startAyah; i <= test.endAyah; i++) {
                        previouslyTestedAyahs.add(`${test.surahNumber}:${i}`);
                      }
                    });
                    
                    let newUnique = 0;
                    testAyahs.forEach(ayah => {
                      if (!previouslyTestedAyahs.has(ayah)) newUnique++;
                    });
                    newProgress += newUnique;
                  }
                } else if (fc.type === 'test') {
                  newProgress += 1;
                }
                
                if (newProgress >= fc.target) {
                  try {
                    await updateDoc(doc(db, 'friendChallenges', fc.id), { status: 'completed', progress: fc.target });
                  } catch (error) {
                    console.error("Error updating friend challenge status:", error);
                  }
                  // Award points for completing friend challenge
                  const friendChallengePoints = fc.type === 'ayahs' ? fc.target * 5 : fc.target * 50;
                  get().addPoints(friendChallengePoints);
                } else {
                  // Update progress in Firestore
                  try {
                    await updateDoc(doc(db, 'friendChallenges', fc.id), { progress: newProgress });
                  } catch (error) {
                    console.error("Error updating friend challenge progress:", error);
                  }
                }
              }
            });
          }

          return {
            testHistory: newTestHistory,
            streakDays: newStreak,
            highestStreak: newHighestStreak,
            lastTestDate: today,
            points: newPoints,
            weeklyPoints: newWeeklyPoints,
            monthlyPoints: newMonthlyPoints,
            lastWeeklyReset: currentWeek,
            lastMonthlyReset: currentMonth,
            achievements: newAchievements,
            challenges: newChallenges,
          };
        });
        get().syncUserProfileToFirebase();
      },

      addPoints: (points) => {
        set((state) => {
          const now = new Date();
          const getWeekNumber = (d: Date) => {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
            return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
          };
          const currentWeek = `${now.getFullYear()}-W${getWeekNumber(now)}`;
          const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

          let newWeeklyPoints = state.weeklyPoints || 0;
          let newMonthlyPoints = state.monthlyPoints || 0;

          if (state.lastWeeklyReset !== currentWeek) {
            newWeeklyPoints = 0;
          }
          if (state.lastMonthlyReset !== currentMonth) {
            newMonthlyPoints = 0;
          }

          return { 
            points: state.points + points,
            weeklyPoints: newWeeklyPoints + points,
            monthlyPoints: newMonthlyPoints + points,
            lastWeeklyReset: currentWeek,
            lastMonthlyReset: currentMonth
          };
        });
        get().syncUserProfileToFirebase();
      },
      
      unlockAchievement: (id) => set((state) => ({
        achievements: state.achievements.includes(id) 
          ? state.achievements 
          : [...state.achievements, id]
      })),

      unlockTheme: (themeId, cost) => {
        set((state) => {
          if (state.points >= cost && !state.unlockedThemes.includes(themeId)) {
            return {
              points: state.points - cost,
              unlockedThemes: [...state.unlockedThemes, themeId]
            };
          }
          return state;
        });
        get().syncUserProfileToFirebase();
      },

      unlockTreeShape: (treeId, cost) => {
        set((state) => {
          if (state.points >= cost && !state.unlockedTreeShapes.includes(treeId)) {
            return {
              points: state.points - cost,
              unlockedTreeShapes: [...state.unlockedTreeShapes, treeId]
            };
          }
          return state;
        });
        get().syncUserProfileToFirebase();
      },

      setMemorizationPlan: (plan) => set({ memorizationPlan: plan }),
      
      setThemePreferences: (prefs) => set((state) => ({
        themePreferences: { ...state.themePreferences, ...prefs }
      })),

      generateDailyChallenges: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        let newChallenges = [...state.challenges.filter(c => c.expiresAt >= today)]; // Remove expired

        // Update existing challenges with new titles and rewards
        newChallenges = newChallenges.map(c => {
          if (c.id.startsWith('daily_ayahs_10_')) return { ...c, title: 'حفظ 10 آيات', reward: '45 نقطة' };
          if (c.id.startsWith('daily_ayahs_20_')) return { ...c, title: 'حفظ 20 آية مختلفة', reward: '100 نقطة' };
          if (c.id.startsWith('daily_ayahs_50_')) return { ...c, title: 'حفظ 50 آية مختلفة', reward: '250 نقطة' };
          if (c.id.startsWith('daily_test_1_')) return { ...c, title: 'تسميع سورة واحدة مختلفة', reward: '100 نقطة' };
          if (c.id.startsWith('daily_test_3_')) return { ...c, title: 'تسميع 3 سور مختلفة', reward: '400 نقطة' };
          if (c.id.startsWith('weekly_ayahs_100_')) return { ...c, title: 'حفظ 100 آية مختلفة', reward: '600 نقطة' };
          if (c.id.startsWith('weekly_ayahs_250_')) return { ...c, title: 'حفظ 250 آية مختلفة', reward: '1300 نقطة' };
          if (c.id.startsWith('weekly_test_5_')) return { ...c, title: 'تسميع 5 سور مختلفة', reward: '1000 نقطة' };
          if (c.id.startsWith('weekly_test_10_')) return { ...c, title: 'تسميع 10 سور مختلفة', reward: '2000 نقطة' };
          return c;
        });

        const hasDaily = newChallenges.some(c => c.type === 'daily' && c.expiresAt === today);
        const hasWeekly = newChallenges.some(c => c.type === 'weekly' && c.expiresAt >= today);

        if (!hasDaily) {
          newChallenges.push(
            { id: `daily_ayahs_10_${today}`, type: 'daily', title: 'حفظ 10 آيات', target: 10, progress: 0, completed: false, expiresAt: today, reward: '45 نقطة', createdAt: today },
            { id: `daily_ayahs_20_${today}`, type: 'daily', title: 'حفظ 20 آية مختلفة', target: 20, progress: 0, completed: false, expiresAt: today, reward: '100 نقطة', createdAt: today },
            { id: `daily_ayahs_50_${today}`, type: 'daily', title: 'حفظ 50 آية مختلفة', target: 50, progress: 0, completed: false, expiresAt: today, reward: '250 نقطة', createdAt: today },
            { id: `daily_test_1_${today}`, type: 'daily', title: 'تسميع سورة واحدة مختلفة', target: 1, progress: 0, completed: false, expiresAt: today, reward: '100 نقطة', createdAt: today },
            { id: `daily_test_3_${today}`, type: 'daily', title: 'تسميع 3 سور مختلفة', target: 3, progress: 0, completed: false, expiresAt: today, reward: '400 نقطة', createdAt: today }
          );
        }

        if (!hasWeekly) {
          newChallenges.push(
            { id: `weekly_ayahs_100_${nextWeekStr}`, type: 'weekly', title: 'حفظ 100 آية مختلفة', target: 100, progress: 0, completed: false, expiresAt: nextWeekStr, reward: '600 نقطة', createdAt: today },
            { id: `weekly_ayahs_250_${nextWeekStr}`, type: 'weekly', title: 'حفظ 250 آية مختلفة', target: 250, progress: 0, completed: false, expiresAt: nextWeekStr, reward: '1300 نقطة', createdAt: today },
            { id: `weekly_test_5_${nextWeekStr}`, type: 'weekly', title: 'تسميع 5 سور مختلفة', target: 5, progress: 0, completed: false, expiresAt: nextWeekStr, reward: '1000 نقطة', createdAt: today },
            { id: `weekly_test_10_${nextWeekStr}`, type: 'weekly', title: 'تسميع 10 سور مختلفة', target: 10, progress: 0, completed: false, expiresAt: nextWeekStr, reward: '2000 نقطة', createdAt: today }
          );
        } else {
          // Ensure the 10 surahs weekly challenge exists if they already have weekly challenges
          const has10SurahsWeekly = newChallenges.some(c => c.id.startsWith('weekly_test_10_'));
          if (!has10SurahsWeekly) {
            const existingWeekly = newChallenges.find(c => c.type === 'weekly');
            const expiresAt = existingWeekly ? existingWeekly.expiresAt : nextWeekStr;
            newChallenges.push(
              { id: `weekly_test_10_${expiresAt}`, type: 'weekly', title: 'تسميع 10 سور مختلفة', target: 10, progress: 0, completed: false, expiresAt: expiresAt, reward: '2000 نقطة', createdAt: today }
            );
          }
        }

        return { challenges: newChallenges };
      }),
    }),
    {
      name: 'quran-memorization-storage',
      partialize: (state) => ({
        memorizedSurahs: state.memorizedSurahs,
        testHistory: state.testHistory,
        streakDays: state.streakDays,
        highestStreak: state.highestStreak,
        lastTestDate: state.lastTestDate,
        points: state.points,
        achievements: state.achievements,
        memorizationPlan: state.memorizationPlan,
        themePreferences: state.themePreferences,
        challenges: state.challenges,
        unlockedThemes: state.unlockedThemes,
        unlockedTreeShapes: state.unlockedTreeShapes,
        hasResetV2: state.hasResetV2,
      }),
    }
  )
);
