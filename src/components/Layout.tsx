import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BarChart2, User, Trophy, Swords } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { useNetwork } from '../hooks/useNetwork';
import OfflineDialog from './OfflineDialog';

export default function Layout() {
  const { themePreferences } = useStore();
  const isOnline = useNetwork();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply dark mode
    if (themePreferences.darkMode === 'dark') {
      root.classList.add('dark');
    } else if (themePreferences.darkMode === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply font
    root.classList.remove('font-amiri', 'font-hafs', 'font-uthmani');
    root.classList.add(`font-${themePreferences.font}`);

    // Apply color theme
    root.setAttribute('data-theme', themePreferences.color);

  }, [themePreferences]);

  const handleOnlineRequiredClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!isOnline) {
      e.preventDefault();
      setShowOfflineDialog(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <main className="flex-1 overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>

      <OfflineDialog isOpen={showOfflineDialog} onClose={() => setShowOfflineDialog(false)} />

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2 z-50">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`
          }
        >
          <Home size={22} />
          <span className="text-[9px] font-medium uppercase tracking-wider">الرئيسية</span>
        </NavLink>
        <NavLink
          to="/memorize"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`
          }
        >
          <BookOpen size={22} />
          <span className="text-[9px] font-medium uppercase tracking-wider">الحفظ</span>
        </NavLink>
        <NavLink
          to="/challenges"
          onClick={(e) => handleOnlineRequiredClick(e, '/challenges')}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`
          }
        >
          <Swords size={22} />
          <span className="text-[9px] font-medium uppercase tracking-wider">التحديات</span>
        </NavLink>
        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`
          }
        >
          <BarChart2 size={22} />
          <span className="text-[9px] font-medium uppercase tracking-wider">التقدم</span>
        </NavLink>
        <NavLink
          to="/leaderboard"
          onClick={(e) => handleOnlineRequiredClick(e, '/leaderboard')}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`
          }
        >
          <Trophy size={22} />
          <span className="text-[9px] font-medium uppercase tracking-wider">الصدارة</span>
        </NavLink>
        <NavLink
          to="/profile"
          onClick={(e) => handleOnlineRequiredClick(e, '/profile')}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`
          }
        >
          <User size={22} />
          <span className="text-[9px] font-medium uppercase tracking-wider">حسابي</span>
        </NavLink>
      </nav>
    </div>
  );
}
