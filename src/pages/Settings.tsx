import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Monitor,
  Type, 
  LogOut, 
  Trash2, 
  ChevronRight,
  Shield,
  HelpCircle,
  Share2,
  Star,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { auth, signInWithGoogle, onAuthStateChanged } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import SupportBottomSheet from '../components/SupportBottomSheet';
import { useNetwork } from '../hooks/useNetwork';
import OfflineDialog from '../components/OfflineDialog';

export default function Settings() {
  const navigate = useNavigate();
  const { userProfile, themePreferences, setThemePreferences } = useStore();
  const [isSupportSheetOpen, setIsSupportSheetOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);
  const isOnline = useNetwork();
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleShare = async () => {
    const shareText = "ابدأ رحلتك نحو إتقان حفظ القرآن الكريم مع تطبيق 'رحلة الإتقان'. تطبيق رائع يساعدك على الحفظ والمراجعة بطرق مبتكرة وممتعة. حمله الآن وشارك الأجر!\n\nhttps://play.google.com/store/apps/details?id=com.my.app.rehla.quran";
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تطبيق رحلة الإتقان',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('تم نسخ رابط التطبيق بنجاح!');
    }
  };

  const handleRate = () => {
    window.open('https://play.google.com/store/apps/details?id=com.my.app.rehla.quran', '_blank');
  };

  const handleLogout = async () => {
    if (!isOnline) {
      setShowOfflineDialog(true);
      return;
    }
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLogin = async () => {
    if (!isOnline) {
      setShowOfflineDialog(true);
      return;
    }
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-4">
        {title}
      </h3>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700/50">
        {children}
      </div>
    </div>
  );

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    action, 
    danger = false 
  }: { 
    icon: any, 
    title: string, 
    subtitle?: string, 
    action?: React.ReactNode,
    danger?: boolean
  }) => (
    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${danger ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-right">
          <p className={`font-medium ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action || <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />}
    </div>
  );

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الإعدادات</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">تخصيص تجربتك في التطبيق</p>
          </div>
        </div>

        <SettingSection title="المظهر والقراءة">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Monitor size={16} /> الوضع الليلي
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', icon: Sun, label: 'فاتح' },
                { id: 'dark', icon: Moon, label: 'داكن' },
                { id: 'system', icon: Monitor, label: 'النظام' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setThemePreferences({ darkMode: mode.id as any })}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${themePreferences.darkMode === mode.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  <mode.icon size={18} />
                  <span className="text-xs">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Type size={16} /> نوع الخط
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['amiri', 'hafs', 'uthmani'].map(font => (
                <button
                  key={font}
                  onClick={() => setThemePreferences({ font: font as any })}
                  className={`p-2 rounded-xl border text-center transition-all ${themePreferences.font === font ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  {font === 'amiri' ? 'أميري' : font === 'hafs' ? 'حفص' : 'عثماني'}
                </button>
              ))}
            </div>
          </div>
          
          <SettingItem 
            icon={Type} 
            title="حجم خط المصحف" 
            subtitle="تكبير أو تصغير الآيات"
            action={
              <div className="flex items-center gap-3" dir="ltr">
                <button 
                  onClick={() => setThemePreferences({ fontSize: Math.max(16, themePreferences.fontSize - 2) })}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                >-</button>
                <span className="text-sm font-medium w-6 text-center dark:text-white">{themePreferences.fontSize}</span>
                <button 
                  onClick={() => setThemePreferences({ fontSize: Math.min(40, themePreferences.fontSize + 2) })}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                >+</button>
              </div>
            }
          />
        </SettingSection>

        <SettingSection title="الدعم والمجتمع">
          <button onClick={handleShare} className="w-full text-right"><SettingItem icon={Share2} title="شارك التطبيق" subtitle="دعوة الأصدقاء للمنافسة" /></button>
          <button onClick={handleRate} className="w-full text-right"><SettingItem icon={Star} title="قيّم التطبيق" subtitle="أخبرنا برأيك في المتجر" /></button>
          <button onClick={() => setIsSupportSheetOpen(true)} className="w-full text-right"><SettingItem icon={HelpCircle} title="المساعدة والدعم" subtitle="الأسئلة الشائعة والتواصل" /></button>
          <a href="https://sites.google.com/view/the-journey-of-mastery" target="_blank" rel="noopener noreferrer" className="w-full block text-right"><SettingItem icon={Shield} title="سياسة الخصوصية" /></a>
        </SettingSection>

        <SettingSection title="الحساب">
          {isAuthenticated ? (
            <>
              <button onClick={handleLogout} className="w-full text-right">
                <SettingItem icon={LogOut} title="تسجيل الخروج" subtitle={userProfile?.email || ''} />
              </button>
              <button className="w-full text-right">
                <SettingItem icon={Trash2} title="حذف الحساب" subtitle="حذف جميع بياناتك نهائياً" danger />
              </button>
            </>
          ) : (
            <button onClick={handleLogin} className="w-full text-right">
              <SettingItem icon={LogOut} title="تسجيل الدخول" subtitle="سجل دخولك لحفظ تقدمك" />
            </button>
          )}
        </SettingSection>

        <div className="text-center mt-8 mb-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">الإصدار 1.0.0</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">صُنع بحب لخدمة كتاب الله</p>
        </div>
      </motion.div>

      <SupportBottomSheet 
        isOpen={isSupportSheetOpen} 
        onClose={() => setIsSupportSheetOpen(false)} 
      />
      <OfflineDialog isOpen={showOfflineDialog} onClose={() => setShowOfflineDialog(false)} />
    </div>
  );
}
