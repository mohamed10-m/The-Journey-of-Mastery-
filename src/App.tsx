import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { auth, onAuthStateChanged, db, doc, getDoc } from './firebase';
import Layout from './components/Layout';
import Home from './pages/Home';
import Memorize from './pages/Memorize';
import SetupTest from './pages/SetupTest';
import TestMode from './pages/TestMode';
import Progress from './pages/Progress';
import SurahView from './pages/SurahView';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Challenges from './pages/Challenges';
import Settings from './pages/Settings';
import About from './pages/About';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const { themePreferences, setUserProfile, syncUserProfileToFirebase, listenToFriendChallenges, checkAndResetTimeframes, generateDailyChallenges, hasResetV2, performV2Reset } = useStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!hasResetV2) {
      performV2Reset();
    }
  }, [hasResetV2, performV2Reset]);

  useEffect(() => {
    checkAndResetTimeframes();
    generateDailyChallenges();
    let unsubscribeChallenges: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Try to fetch existing profile
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (!data.hasResetV2) {
              performV2Reset();
            } else {
              // Update store state with Firestore data
              useStore.setState({
                points: data.points !== undefined ? data.points : useStore.getState().points,
                weeklyPoints: data.weeklyPoints !== undefined ? data.weeklyPoints : useStore.getState().weeklyPoints,
                monthlyPoints: data.monthlyPoints !== undefined ? data.monthlyPoints : useStore.getState().monthlyPoints,
                streakDays: data.streakDays !== undefined ? data.streakDays : useStore.getState().streakDays,
                highestStreak: data.highestStreak !== undefined ? data.highestStreak : useStore.getState().highestStreak,
                unlockedThemes: data.unlockedThemes || useStore.getState().unlockedThemes,
                unlockedTreeShapes: data.unlockedTreeShapes || useStore.getState().unlockedTreeShapes,
                hasResetV2: true,
              });
            }

            setUserProfile({
              uid: user.uid,
              displayName: data.displayName || 'مستخدم',
              photoURL: data.photoURL || '',
              gender: data.gender,
              points: useStore.getState().points,
              weeklyPoints: useStore.getState().weeklyPoints,
              monthlyPoints: useStore.getState().monthlyPoints,
              level: data.level || 'مبتدئ',
              streakDays: useStore.getState().streakDays,
              highestStreak: useStore.getState().highestStreak,
              lastActive: new Date().toISOString(),
              unlockedThemes: useStore.getState().unlockedThemes,
              unlockedTreeShapes: useStore.getState().unlockedTreeShapes,
            });
          } else {
            setUserProfile({
              uid: user.uid,
              displayName: user.displayName || 'مستخدم',
              photoURL: user.photoURL || '',
              points: useStore.getState().points,
              level: 'مبتدئ',
              streakDays: useStore.getState().streakDays,
              highestStreak: useStore.getState().highestStreak,
              lastActive: new Date().toISOString(),
              unlockedThemes: useStore.getState().unlockedThemes,
              unlockedTreeShapes: useStore.getState().unlockedTreeShapes,
            });
          }
          syncUserProfileToFirebase();
          unsubscribeChallenges = listenToFriendChallenges();
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        if (unsubscribeChallenges) {
          unsubscribeChallenges();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeChallenges) {
        unsubscribeChallenges();
      }
    };
  }, [setUserProfile, syncUserProfileToFirebase, listenToFriendChallenges, checkAndResetTimeframes, generateDailyChallenges, performV2Reset]);

  useEffect(() => {
    // Apply dark mode
    if (themePreferences.darkMode === 'dark' || (themePreferences.darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply color theme
    document.documentElement.classList.remove('theme-blue', 'theme-purple', 'theme-amber');
    if (themePreferences.color !== 'primary') {
      document.documentElement.classList.add(`theme-${themePreferences.color}`);
    }
  }, [themePreferences]);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="memorize" element={<Memorize />} />
            <Route path="progress" element={<Progress />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<About />} />
          </Route>
          <Route path="/setup/:id" element={<SetupTest />} />
          <Route path="/surah/:id" element={<SurahView />} />
          <Route path="/test/:id" element={<TestMode />} />
        </Routes>
      </Router>
    </>
  );
}
