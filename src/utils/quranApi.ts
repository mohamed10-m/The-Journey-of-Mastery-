export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

let cachedQuranData: any = null;

async function getQuranData() {
  if (cachedQuranData) return cachedQuranData;
  try {
    const response = await fetch('./data/quran.json');
    if (!response.ok) throw new Error('Failed to fetch local Quran data');
    const data = await response.json();
    if (!data || !data.data || !data.data.surahs) {
      throw new Error('Invalid local Quran data format');
    }
    cachedQuranData = data.data.surahs;
    return cachedQuranData;
  } catch (error) {
    console.warn('Error loading local Quran data, falling back to API:', error);
    try {
      const response = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
      if (!response.ok) throw new Error('Failed to fetch Quran data from API');
      const data = await response.json();
      cachedQuranData = data.data.surahs;
      return cachedQuranData;
    } catch (apiError) {
      console.error('Error loading Quran data from API:', apiError);
      throw apiError;
    }
  }
}

export async function fetchSurahs(): Promise<Surah[]> {
  const surahs = await getQuranData();
  return surahs.map((s: any) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.ayahs.length,
    revelationType: s.revelationType,
  }));
}

export async function fetchSurah(number: number): Promise<SurahDetail> {
  const surahs = await getQuranData();
  const surah = surahs.find((s: any) => s.number === number);
  if (!surah) throw new Error(`Surah ${number} not found`);
  return {
    ...surah,
    numberOfAyahs: surah.ayahs.length,
  };
}

// Remove diacritics (tashkeel) for easier comparison
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '') // Remove all tashkeel, maddah, and dagger alif
    .replace(/ٱ/g, 'ا') // Normalize alef wasla
    .replace(/أ|إ|آ/g, 'ا') // Normalize alef with hamza
    .replace(/ة/g, 'ه') // Normalize taa marbouta
    .replace(/ى/g, 'ي') // Normalize alef maksura
    .replace(/ؤ/g, 'و') // Normalize waw with hamza
    .replace(/ئ/g, 'ي') // Normalize yaa with hamza
    .replace(/ـ/g, '') // Remove tatweel
    .trim();
}
