import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Download, BookOpen, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupportBottomSheet from '../components/SupportBottomSheet';

export default function About() {
  const navigate = useNavigate();
  const [isSupportSheetOpen, setIsSupportSheetOpen] = useState(false);

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">عن التطبيق</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">تعرف على رحلة الإتقان</p>
          </div>
        </div>

        {/* Logo and Description */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 mb-6 text-center">
          <div className="w-32 h-32 mx-auto rounded-3xl shadow-lg mb-6 bg-gradient-to-br from-emerald-700 to-emerald-900 flex flex-col items-center justify-center text-amber-400 border-4 border-emerald-100 dark:border-emerald-900/50">
            <BookOpen size={48} strokeWidth={1.5} className="mb-2" />
            <span className="font-amiri font-bold text-lg text-white">رحلة الإتقان</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">رحلة الإتقان</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            تطبيق "رحلة الإتقان" هو رفيقك الأمثل في رحلة حفظ ومراجعة القرآن الكريم. صُمم التطبيق بعناية ليقدم تجربة مستخدم فريدة تجمع بين سهولة الاستخدام والأساليب المبتكرة في الحفظ والمراجعة، مع نظام تحفيزي متكامل يساعدك على الاستمرار والمداومة على وردك اليومي.
          </p>
        </div>

        {/* Our Apps */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-4">
            تطبيقاتنا
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-amber-300 shrink-0">
              <Moon size={28} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">في رحاب القرآن</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                تطبيق شامل لكل ما يحتاجه المسلم في يومه من قرآن، أذكار، ومواقيت الصلاة.
              </p>
              <button 
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.my.al.muslim.mquran', '_blank')}
                className="flex items-center justify-center gap-2 w-full py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
              >
                <Download className="w-4 h-4" />
                تنزيل التطبيق
              </button>
            </div>
          </div>
        </div>

        {/* About Founders */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-4">
            عن المؤسسين
          </h3>
          <div className="bg-gradient-to-br from-primary-50 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 shadow-sm border border-primary-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full -translate-x-16 -translate-y-16 blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full translate-x-16 translate-y-16 blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-sm font-bold text-primary-600 dark:text-primary-400 shadow-sm">م. محمد جمعة</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-sm font-bold text-primary-600 dark:text-primary-400 shadow-sm">م. أحمد إبراهيم</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                نسعى لتقديم حلول تقنية مبتكرة تخدم كتاب الله وتيسر على المسلمين حفظه وفهمه. نؤمن بأن التكنولوجيا يمكن أن تكون وسيلة فعالة لنشر الخير، ونسأل الله أن يجعل هذا العمل خالصاً لوجهه الكريم.
              </p>
            </div>
          </div>
        </div>

        {/* Help and Support */}
        <button 
          onClick={() => setIsSupportSheetOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h4 className="font-bold text-slate-900 dark:text-white">المساعدة والدعم</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تواصل معنا لأي استفسار أو اقتراح</p>
            </div>
          </div>
        </button>

      </motion.div>

      <SupportBottomSheet 
        isOpen={isSupportSheetOpen} 
        onClose={() => setIsSupportSheetOpen(false)} 
      />
    </div>
  );
}
