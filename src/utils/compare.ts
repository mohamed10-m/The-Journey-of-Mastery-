import * as diff from 'diff';
import { normalizeArabic } from './quranApi';

export interface ComparisonResult {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export type WordStatus = 'correct' | 'wrong' | 'pending';

const MUQATTAAT: Record<string, string[]> = {
  'الم': ['الف', 'لام', 'ميم'],
  'المص': ['الف', 'لام', 'ميم', 'صاد'],
  'الر': ['الف', 'لام', 'را'],
  'المر': ['الف', 'لام', 'ميم', 'را'],
  'كهيعص': ['كاف', 'ها', 'يا', 'عين', 'صاد'],
  'طه': ['طا', 'ها'],
  'طسم': ['طا', 'سين', 'ميم'],
  'طس': ['طا', 'سين'],
  'يس': ['يا', 'سين'],
  'ص': ['صاد'],
  'حم': ['حا', 'ميم'],
  'عسق': ['عين', 'سين', 'قاف'],
  'ق': ['قاف'],
  'ن': ['نون'],
};

export function isWordMatch(expected: string, spoken: string): boolean {
  if (expected === spoken) return true;

  // Common prefixes that might be misheard or added/dropped
  const prefixes = ['و', 'ف', 'ب', 'ل', 'ك', 'ال', 'وال', 'فال', 'بال', 'كال', 'لل'];
  for (const prefix of prefixes) {
    if (spoken.startsWith(prefix) && spoken.substring(prefix.length) === expected) return true;
    if (expected.startsWith(prefix) && expected.substring(prefix.length) === spoken) return true;
  }

  // Common suffixes
  const suffixes = ['ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'ه', 'ي', 'ك', 'ت', 'وا', 'ون', 'ين', 'ان', 'تم'];
  for (const suffix of suffixes) {
    if (spoken.endsWith(suffix) && spoken.substring(0, spoken.length - suffix.length) === expected && expected.length >= 3) return true;
    if (expected.endsWith(suffix) && expected.substring(0, expected.length - suffix.length) === spoken && spoken.length >= 3) return true;
  }

  // Remove Alefs and compare
  const stripAlef = (w: string) => w.replace(/ا/g, '');
  if (stripAlef(expected) === stripAlef(spoken) && expected.length >= 3) return true;

  // Handle الصلوة, الزكوة, الحيوة, الربوا
  const expectedWithoutWaw = expected.replace(/و/g, 'ا').replace(/اا/g, 'ا');
  if (expectedWithoutWaw === spoken || stripAlef(expectedWithoutWaw) === stripAlef(spoken)) return true;

  // Handle Hamza and Alef variations
  const stripHamza = (w: string) => w.replace(/ء/g, '').replace(/أ/g, 'ا').replace(/إ/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/آ/g, 'ا');
  if (stripHamza(expected) === stripHamza(spoken)) return true;

  // Handle trailing Yaa, Alef Maksura, and duplicate Yaa (e.g., يحيي vs يحي)
  const normalizeYaa = (w: string) => w.replace(/يي/g, 'ي').replace(/ي$/g, '').replace(/ى/g, 'ي').replace(/ى$/g, '');
  if (normalizeYaa(expected) === normalizeYaa(spoken) && expected.length >= 3) return true;

  // Handle Taa Marbouta vs Haa
  const normalizeTaa = (w: string) => w.replace(/ة/g, 'ه');
  if (normalizeTaa(expected) === normalizeTaa(spoken)) return true;

  // Aggressive consonant match for words >= 4 chars
  // This helps with words where the speech API might misinterpret vowels
  const consonantsOnly = (w: string) => w.replace(/[اويءهةى]/g, '');
  if (expected.length >= 4 && consonantsOnly(expected) === consonantsOnly(spoken)) return true;

  // Substring match for longer words (if speech API caught part of it, e.g. "المستقيم" -> "مستقيم")
  if (expected.length >= 5 && spoken.length >= 4) {
    if (expected.includes(spoken) || spoken.includes(expected)) return true;
  }

  return false;
}

export function alignRecitation(expectedWords: string[], spokenText: string): WordStatus[] {
  const spokenWords = normalizeArabic(spokenText).split(/\s+/).filter(Boolean);
  const statuses: WordStatus[] = expectedWords.map(() => 'pending');
  
  let expectedIndex = 0;
  let spokenIndex = 0;

  while (spokenIndex < spokenWords.length && expectedIndex < expectedWords.length) {
    const expectedNormalized = normalizeArabic(expectedWords[expectedIndex]);
    const spokenNormalized = spokenWords[spokenIndex];

    if (isWordMatch(expectedNormalized, spokenNormalized)) {
      statuses[expectedIndex] = 'correct';
      expectedIndex++;
      spokenIndex++;
    } else {
      // Check for merged/split words (e.g., "يايها" vs "يا ايها" or "بما" vs "ب ما")
      let handledMergeOrSplit = false;

      // 0. Check for Muqatta'at (Quranic initials)
      if (MUQATTAAT[expectedNormalized]) {
        const expectedParts = MUQATTAAT[expectedNormalized];
        let matches = true;
        for (let i = 0; i < expectedParts.length; i++) {
          if (spokenIndex + i >= spokenWords.length || !isWordMatch(expectedParts[i], spokenWords[spokenIndex + i])) {
            matches = false;
            break;
          }
        }
        if (matches) {
          statuses[expectedIndex] = 'correct';
          expectedIndex++;
          spokenIndex += expectedParts.length;
          handledMergeOrSplit = true;
        }
      }

      // 1. Expected is 1 word, Spoken is 2 words ("يايها" vs "يا", "ايها")
      if (!handledMergeOrSplit && spokenIndex + 1 < spokenWords.length) {
        const combinedSpoken = spokenNormalized + spokenWords[spokenIndex + 1];
        if (isWordMatch(expectedNormalized, combinedSpoken)) {
          statuses[expectedIndex] = 'correct';
          expectedIndex++;
          spokenIndex += 2; // Consume two spoken words
          handledMergeOrSplit = true;
        }
      }

      // 2. Expected is 2 words, Spoken is 1 word ("يا", "ايها" vs "يايها")
      if (!handledMergeOrSplit && expectedIndex + 1 < expectedWords.length) {
        const combinedExpected = expectedNormalized + normalizeArabic(expectedWords[expectedIndex + 1]);
        if (isWordMatch(combinedExpected, spokenNormalized)) {
          statuses[expectedIndex] = 'correct';
          statuses[expectedIndex + 1] = 'correct';
          expectedIndex += 2; // Consume two expected words
          spokenIndex++;
          handledMergeOrSplit = true;
        }
      }

      if (!handledMergeOrSplit) {
        // Mismatch. Look ahead to see if user skipped words or added extra words.
        let expectedLookaheadMatch = -1;
        let spokenLookaheadMatch = -1;

        // 1. Find closest match in expected (user skipped words)
        for (let lookahead = 1; lookahead <= 5 && expectedIndex + lookahead < expectedWords.length; lookahead++) {
          if (isWordMatch(normalizeArabic(expectedWords[expectedIndex + lookahead]), spokenNormalized)) {
            expectedLookaheadMatch = lookahead;
            break;
          }
        }

        // 2. Find closest match in spoken (user inserted extra words or corrected themselves)
        // Increased lookahead to 20 to handle long unstripped phrases (like full Isti'adha + Bismillah + extra words)
        for (let lookahead = 1; lookahead <= 20 && spokenIndex + lookahead < spokenWords.length; lookahead++) {
          if (isWordMatch(expectedNormalized, spokenWords[spokenIndex + lookahead])) {
            spokenLookaheadMatch = lookahead;
            break;
          }
        }

        if (expectedLookaheadMatch !== -1 && spokenLookaheadMatch !== -1) {
          // Both matched. Pick the one with the smaller distance.
          // If equal, prefer spoken lookahead (assume user inserted a word rather than skipped)
          if (spokenLookaheadMatch <= expectedLookaheadMatch) {
            spokenIndex += spokenLookaheadMatch;
          } else {
            for (let i = 0; i < expectedLookaheadMatch; i++) {
              statuses[expectedIndex + i] = 'wrong';
            }
            expectedIndex += expectedLookaheadMatch;
          }
        } else if (spokenLookaheadMatch !== -1) {
          // Only matched in spoken
          spokenIndex += spokenLookaheadMatch;
        } else if (expectedLookaheadMatch !== -1) {
          // Only matched in expected
          for (let i = 0; i < expectedLookaheadMatch; i++) {
            statuses[expectedIndex + i] = 'wrong';
          }
          expectedIndex += expectedLookaheadMatch;
        } else {
          // No match in either direction
          statuses[expectedIndex] = 'wrong';
          expectedIndex++;
          spokenIndex++;
        }
      }
    }
  }

  return statuses;
}

export function compareRecitation(original: string, spoken: string): ComparisonResult[] {
  const normalizedOriginal = normalizeArabic(original);
  const normalizedSpoken = normalizeArabic(spoken);

  // We want to compare word by word
  const originalWords = normalizedOriginal.split(/\s+/).filter(Boolean);
  const spokenWords = normalizedSpoken.split(/\s+/).filter(Boolean);

  const diffResult = diff.diffArrays(originalWords, spokenWords);

  return diffResult.map((part) => ({
    value: part.value.join(' '),
    added: part.added,
    removed: part.removed,
  }));
}

export function calculateAccuracy(original: string, spoken: string): {
  accuracy: number;
  correctWords: number;
  mistakes: number;
  missingWords: number;
} {
  const originalWords = normalizeArabic(original).split(/\s+/).filter(Boolean);
  const statuses = alignRecitation(originalWords, spoken);

  let correctWords = 0;
  let mistakes = 0;
  let missingWords = 0;

  statuses.forEach((status) => {
    if (status === 'correct') {
      correctWords++;
    } else if (status === 'wrong') {
      mistakes++;
    } else if (status === 'pending') {
      missingWords++;
    }
  });

  const totalOriginalWords = originalWords.length;
  const accuracy = totalOriginalWords > 0 ? (correctWords / totalOriginalWords) * 100 : 0;

  return {
    accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
    correctWords,
    mistakes,
    missingWords,
  };
}
