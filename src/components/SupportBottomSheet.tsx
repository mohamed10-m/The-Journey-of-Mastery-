import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Mail } from 'lucide-react';

interface SupportBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportBottomSheet({ isOpen, onClose }: SupportBottomSheetProps) {
  const handleWhatsApp = (phone: string) => {
    const message = encodeURIComponent("السلام عليكم، لدي استفسار بخصوص تطبيق رحلة الإتقان...");
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("استفسار بخصوص تطبيق رحلة الإتقان");
    window.open(`mailto:medotop1080@gmail.com?subject=${subject}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl z-[70] p-6 pb-24 shadow-2xl max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">المساعدة والدعم</h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-xl">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">التواصل عبر واتساب</h4>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleWhatsApp('201016947524')}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">م. محمد جمعة</span>
                  </button>
                  <button 
                    onClick={() => handleWhatsApp('201014407034')}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">م. أحمد إبراهيم</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleEmail}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-right"
              >
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">التواصل عبر البريد الإلكتروني</h4>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
