import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, X } from 'lucide-react';

interface OfflineDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfflineDialog({ isOpen, onClose }: OfflineDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            dir="rtl"
          >
            <div className="p-6 text-center">
              <div className="w-20 h-20 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <WifiOff className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                لا يوجد اتصال بالإنترنت
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                هذه الصفحة تتطلب اتصالاً بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                حسناً
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
