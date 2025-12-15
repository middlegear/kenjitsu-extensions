/**
 * Improved string similarity comparison focusing on TV show title matching
 */
export function compareTwoStrings(first: string, second: string): number {
  const normalize = (s: string): string => {
    if (typeof s !== 'string') return '';
    return s
      .toLowerCase()
      .replace(/[^\w]/g, ' ') // keep letters, numbers, spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getBigrams = (s: string): Set<string> => {
    const cleaned = s.replace(/\s+/g, ''); // remove spaces for bigrams
    const bigrams = new Set<string>();
    for (let i = 0; i < cleaned.length - 1; i++) {
      bigrams.add(cleaned.substr(i, 2));
    }
    return bigrams;
  };

  first = normalize(first);
  second = normalize(second);

  if (first === second) return 1;
  if (!first || !second) return 0;

  const set1 = getBigrams(first);
  const set2 = getBigrams(second);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const bg of set2) {
    if (set1.has(bg)) intersection++;
  }

  // Sørensen–Dice coefficient
  return (2 * intersection) / (set1.size + set2.size);
}

/**
 * Improved best match finder for TV show titles
 */
export function findBestMatch(main: string, targets: string[]) {
  if (typeof main !== 'string' || !Array.isArray(targets)) {
    throw new Error('Invalid arguments: main must be string and targets must be array');
  }

  if (targets.length === 0) {
    return {
      ratings: [],
      bestMatch: { target: '', rating: 0 },
      bestMatchIndex: -1,
    };
  }

  const normalizedMain = compareTwoStrings.normalize(main);
  const lenMain = normalizedMain.length;

  let bestIndex = 0;
  let bestRating = -1;
  const ratings = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const rating = compareTwoStrings(normalizedMain, target);
    ratings.push({ target, rating });

    if (rating > bestRating) {
      bestRating = rating;
      bestIndex = i;
    }
  }

  return {
    ratings,
    bestMatch: ratings[bestIndex],
    bestMatchIndex: bestIndex,
  };
}

compareTwoStrings.normalize = (str: string) => {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .toLowerCase()
    .replace(/[^\w\s]|_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/// for the japanese stuff
function normalizeJapaneseTitle(s: string): string {
  if (!s) return '';
  return (
    s
      .trim()
      // Normalize fullwidth digits to halfwidth
      .replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
      // Remove common suffixes that vary (season markers, OVA, etc.)
      .replace(/\s*(?:SEASON\s*\d+|OVA\s*\d+|シーズン|記念スペシャル).*$/gi, '')
      .replace(/\s+\d+$/, '') // Remove trailing season number if isolated
      .trim()
  );
}

export function nativeSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  // Exact match after basic trim
  if (a.trim() === b.trim()) return 1.0;

  const normA = normalizeJapaneseTitle(a);
  const normB = normalizeJapaneseTitle(b);

  if (normA === normB) return 1.0;

  const bigramsA = new Set();
  for (let i = 0; i < normA.length - 1; i++) {
    bigramsA.add(normA.substr(i, 2));
  }
  const bigramsB = new Set();
  for (let i = 0; i < normB.length - 1; i++) {
    bigramsB.add(normB.substr(i, 2));
  }

  const intersection = [...bigramsA].filter(x => bigramsB.has(x)).length;
  const union = bigramsA.size + bigramsB.size - intersection;

  const diceScore = union > 0 ? (2 * intersection) / union : 0;

  // If strings are short and very similar, boost with substring check
  const shorter = normA.length < normB.length ? normA : normB;
  const longer = normA.length >= normB.length ? normA : normB;
  if (longer.includes(shorter) || shorter.length >= longer.length * 0.8) {
    return Math.max(diceScore, 0.9); // Treat near-substrings as very high
  }

  return diceScore;
}
