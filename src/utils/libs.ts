import { token_sort_ratio } from 'fuzzball';

interface AnimeResult {
  id: string | number | null;
  name: string | null;
  romaji: string | null;
}

interface AnilistTitles {
  english: string | null;
  romaji: string | null;
}

interface SeasonInfo {
  base: string;
  season: number;
  hasMarker: boolean;
}

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function romanToInt(input: string): number | null {
  if (!/^[IVXLCDM]+$/.test(input)) return null;

  let total = 0;
  let prevValue = 0;

  for (let i = input.length - 1; i >= 0; i--) {
    const value = ROMAN_VALUES[input[i]];
    if (value < prevValue) {
      total -= value;
    } else {
      total += value;
    }
    prevValue = value;
  }

  if (total <= 0 || total > 3999) return null;
  return toRoman(total) === input ? total : null;
}

function toRoman(num: number): string {
  const table: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  for (const [value, symbol] of table) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

function parseSeasonInfo(rawTitle: string): SeasonInfo {
  const title = rawTitle.trim();

  // Arabic-numeral patterns (case-insensitive)
  const arabicPatterns: RegExp[] = [
    /\bseason\s*(\d+)\b/i, // "Season 2"
    /\b(\d+)(?:st|nd|rd|th)\s*season\b/i, // "2nd Season"
    /\bpart\s*(\d+)\b/i, // "Part 3"
    /\bcour\s*(\d+)\b/i, // "Cour 2"
    /\bs(\d+)\b/i, // "S2"
    /(\d+)\s*$/, // trailing bare number: "... King 4"
  ];

  for (const pattern of arabicPatterns) {
    const match = title.match(pattern);
    if (match) {
      const season = parseInt(match[1], 10);
      const base = title.replace(pattern, '').replace(/\s+/g, ' ').trim();
      return { base: base.toLowerCase(), season, hasMarker: true };
    }
  }

  const romanPatterns: RegExp[] = [
    /\bSeason\s+([IVXLCDM]+)\b/, // "Season II"
    /\bPart\s+([IVXLCDM]+)\b/, // "Part IV"
    /\b([IVXLCDM]+)\s*$/, // trailing standalone roman numeral: "... Online II"
  ];

  for (const pattern of romanPatterns) {
    const match = title.match(pattern);
    if (match) {
      const season = romanToInt(match[1]);
      // Reject invalid/malformed numerals and unrealistic season numbers
      if (season !== null && season >= 1 && season <= 20) {
        const base = title.replace(pattern, '').replace(/\s+/g, ' ').trim();
        return { base: base.toLowerCase(), season, hasMarker: true };
      }
    }
  }

  return { base: title.toLowerCase(), season: 1, hasMarker: false };
}

export function findBestMatch(target: AnilistTitles, candidates: AnimeResult[], minScoreThreshold = 60): AnimeResult | null {
  if (!candidates || candidates.length === 0) return null;

  const targetRawTitles = [target.english, target.romaji].filter((t): t is string => Boolean(t && t.trim()));

  if (targetRawTitles.length === 0) return null;

  const targetInfos = targetRawTitles.map(parseSeasonInfo);

  let bestMatch: AnimeResult | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const candidateRawTitles = [candidate.name, candidate.romaji].filter((t): t is string => Boolean(t && t.trim()));

    if (candidateRawTitles.length === 0) continue;

    const candidateInfos = candidateRawTitles.map(parseSeasonInfo);

    let candidateBestScore = 0;

    for (const tInfo of targetInfos) {
      for (const cInfo of candidateInfos) {

        if (tInfo.season !== cInfo.season) {
          continue;
        }

        const score = token_sort_ratio(tInfo.base, cInfo.base);
        candidateBestScore = Math.max(candidateBestScore, score);
      }
    }

    if (candidateBestScore > bestScore) {
      bestScore = candidateBestScore;
      bestMatch = candidate;
    }
  }

  return bestScore >= minScoreThreshold ? bestMatch : null;
}
