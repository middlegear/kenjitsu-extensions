import { distance } from 'fastest-levenshtein';

export function  findBestMatch(target: AnilistTitles, candidates: AnimeResult[]): AnimeResult | null {
  if (candidates.length === 0) return null;

  let bestMatch: AnimeResult | null = null;
  let bestDistance = Number.MAX_SAFE_INTEGER;

  for (const candidate of candidates) {
    if (target.english && candidate.name) {
      const d = distance(target.english.toLowerCase(), candidate.name.toLowerCase());

      if (d < bestDistance) {
        bestDistance = d;
        bestMatch = candidate;
      }
    }

    if (target.romaji && candidate.romaji) {
      const d = distance(target.romaji.toLowerCase(), candidate.romaji.toLowerCase());

      if (d < bestDistance) {
        bestDistance = d;
        bestMatch = candidate;
      }
    }
  }

  return bestMatch;

}

interface AnimeResult {
  id: string | number | null;
  name: string | null;
  romaji: string | null;
}

interface AnilistTitles {
  english: string | null;
  romaji: string | null;
}