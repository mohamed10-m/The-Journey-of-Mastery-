import { Award, Book, BookOpen, Calendar, CheckCircle, Flame, Medal, Star, Trophy, Zap } from 'lucide-react';

export type AchievementCategory = 'memorization' | 'streak' | 'testing';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: AchievementCategory;
  target: number;
  color: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Memorization
  { id: 'mem_1_ayah', title: 'بداية الغيث', description: 'حفظ أول آية', icon: BookOpen, category: 'memorization', target: 1, color: 'bg-primary-100 text-primary-600' },
  { id: 'mem_1_page', title: 'صفحة النور', description: 'حفظ أول صفحة', icon: Book, category: 'memorization', target: 15, color: 'bg-primary-100 text-primary-600' },
  { id: 'mem_1_surah', title: 'سورة كاملة', description: 'حفظ أول سورة', icon: Book, category: 'memorization', target: 1, color: 'bg-primary-100 text-primary-600' }, // Target is handled differently
  { id: 'mem_50_ayah', title: 'طالب علم', description: 'حفظ 50 آية', icon: Award, category: 'memorization', target: 50, color: 'bg-blue-100 text-blue-600' },
  { id: 'mem_100_ayah', title: 'همة عالية', description: 'حفظ 100 آية', icon: Award, category: 'memorization', target: 100, color: 'bg-blue-100 text-blue-600' },
  { id: 'mem_500_ayah', title: 'حافظ متقن', description: 'حفظ 500 آية', icon: Medal, category: 'memorization', target: 500, color: 'bg-purple-100 text-purple-600' },
  { id: 'mem_1_juz', title: 'جزء كامل', description: 'حفظ جزء كامل', icon: Trophy, category: 'memorization', target: 1, color: 'bg-amber-100 text-amber-600' },
  { id: 'mem_5_juz', title: 'خمسة أجزاء', description: 'حفظ خمسة أجزاء', icon: Trophy, category: 'memorization', target: 5, color: 'bg-amber-100 text-amber-600' },
  { id: 'mem_half_quran', title: 'نصف القرآن', description: 'حفظ نصف القرآن', icon: Star, category: 'memorization', target: 15, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'mem_full_quran', title: 'حامل المسك', description: 'حفظ القرآن كاملًا', icon: Star, category: 'memorization', target: 30, color: 'bg-yellow-100 text-yellow-600' },

  // Streak
  { id: 'streak_3', title: 'مواظب', description: 'الحفظ لمدة 3 أيام متتالية', icon: Flame, category: 'streak', target: 3, color: 'bg-orange-100 text-orange-600' },
  { id: 'streak_7', title: 'أسبوع من النور', description: 'الحفظ لمدة 7 أيام متتالية', icon: Flame, category: 'streak', target: 7, color: 'bg-orange-100 text-orange-600' },
  { id: 'streak_30', title: 'شهر مبارك', description: 'الحفظ لمدة 30 يومًا متتاليًا', icon: Calendar, category: 'streak', target: 30, color: 'bg-red-100 text-red-600' },
  { id: 'streak_100', title: 'مئة يوم من العطاء', description: 'الحفظ لمدة 100 يوم متتالي', icon: Calendar, category: 'streak', target: 100, color: 'bg-red-100 text-red-600' },

  // Testing
  { id: 'test_1', title: 'أول الغيث', description: 'أول تسميع ناجح', icon: CheckCircle, category: 'testing', target: 1, color: 'bg-teal-100 text-teal-600' },
  { id: 'test_10', title: 'مثابر', description: '10 عمليات تسميع ناجحة', icon: Zap, category: 'testing', target: 10, color: 'bg-teal-100 text-teal-600' },
  { id: 'test_50', title: 'مختبر متميز', description: '50 تسميعًا ناجحًا', icon: Zap, category: 'testing', target: 50, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'test_100', title: 'خبير التسميع', description: '100 تسميع ناجح', icon: Zap, category: 'testing', target: 100, color: 'bg-cyan-100 text-cyan-600' },
];
