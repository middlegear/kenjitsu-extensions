import { Anizone } from '../provider/anime/anizone.js';

import { Anikoto } from '../provider/anime/anikoto.js';
import { BaseClass, type ClientConfig } from './base.js';

import { AniBD } from '../provider/anime/anibd.js';
import { AniDB } from '../provider/anime/anidb.js';
import { distance } from 'fastest-levenshtein';
import { AnimeHeaven } from '../provider/anime/animeheaven.js';
import { Kitsu } from '../provider/meta/kitsu.js';

interface AnimeResult {
  id: string | number | null;
  name: string | null;
  romaji: string | null;
}

interface AnilistTitles {
  english: string | null;
  romaji: string | null;
}
abstract class BaseAnimeMeta extends BaseClass {
  protected anizone: Anizone;
  protected anikoto: Anikoto;
  protected anibd: AniBD;
  protected anidb: AniDB;
  protected animeheaven: AnimeHeaven;
  protected kitsu: Kitsu;

  constructor(
    options: ClientConfig = {
      browser: 'okhttp4',
      http3: false,
    },
  ) {
    super(options);
    this.anikoto = new Anikoto();
    this.anizone = new Anizone();
    this.anibd = new AniBD();
    this.anidb = new AniDB();
    this.animeheaven = new AnimeHeaven();
    this.kitsu = new Kitsu();
  }

  protected findBestMatch(target: AnilistTitles, candidates: AnimeResult[]): AnimeResult | null {
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



}
export { BaseAnimeMeta };
