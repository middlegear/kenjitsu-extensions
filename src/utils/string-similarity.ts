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
