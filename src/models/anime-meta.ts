import { FetchClient } from '../config/client.js';

import { Anizone } from '../provider/anime/anizone.js';

import { Animepahe } from '../provider/anime/animepahe.js';

import type { IMetaDataMap, Provider } from '../types/meta/meta-anime.js';
import { compareTwoStrings, nativeSimilarity } from '../utils/string-similarity.js';
import { Aniwatch } from '../provider/anime/aniwatch.js';
import { Kaido } from '../provider/anime/kaido.js';
import { Animekai } from '../provider/anime/animekai.js';
import { AniZip } from '../provider/meta/anizip.js';

type AnimeSearchResults = {
  id: string | null;
  name: string | null;
  romaji?: string | null; // pahe lacks this
  provider?: string | null;
  type?: string | null;
  native?: string | null;
  season?: string | null;
  totalEpisodes?: number | null;
  releaseDate?: number | string | null;
};

export default abstract class BaseAnimeMeta {
  protected client: FetchClient;

  protected anizone: Anizone;
  protected aniwatch: Aniwatch;
  protected animepahe: Animepahe;
  protected kaido: Kaido;
  protected animekai: Animekai;
  protected anizip: AniZip;

  constructor(provider: 'jikan' | 'anilist') {
    let delay = null;
    if (provider === 'jikan') {
      delay = 1000;
    } else {
      delay = 200;
    }
    this.client = new FetchClient({ delayBetweenRequests: delay });

    this.aniwatch = new Aniwatch();
    this.animepahe = new Animepahe();
    this.anizone = new Anizone();
    this.kaido = new Kaido();
    this.animekai = new Animekai();
    this.anizip = new AniZip();
  }
  /**
   * Extract year from ISO date string (YYYY-MM-DD format)
   * Handles both full dates and partial years
   * @param dateString - Full date like "2018-10-16" or just "2018"
   * @returns Year as number or null if invalid
   */
  private extractYear(dateString: string | null): number | null {
    if (!dateString) return null;

    // Handle full ISO dates (YYYY-MM-DD) or just years (YYYY)
    const yearMatch = dateString.match(/^(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);

      if (year >= 1900 && year <= 2050) {
        return year;
      }
    }

    return null;
  }
  protected createTitleSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  protected createTitleSlugV2(text: string): string {
    return text
      .toLowerCase()
      .replace(/:/g, '-')
      .replace(/;/g, '-')
      .replace(/[\s_-]+/g, '-')
      .replace(/\s+/g, '-')
      .trim();
  }

  protected mergeEpisodeData(providerEp: any, aniZipEp: any, provider: string) {
    const episodeNumber = providerEp.episodeNumber || aniZipEp?.episodeAnizipNumber || null;
    const rating = aniZipEp?.rating || null;
    const aired = aniZipEp?.aired || null;
    const episodeId = providerEp?.episodeId || null;
    const title = aniZipEp?.title?.english || aniZipEp?.title?.romanizedJapanese || providerEp?.title || null;
    const overview = aniZipEp?.overview || null;
    const thumbnail = providerEp?.teaser || providerEp?.thumbnail || aniZipEp?.image || null;
    const airDate = providerEp?.airDate || aniZipEp?.airDate || null;
    const hasDub = providerEp?.hasDub ?? null;
    const hasSub = providerEp?.hasSub ?? null;
    // const hasRaw = providerEp.hasDub || null; disabled since i cant fetch raw sources from allanime

    return {
      episodeNumber,
      episodeId,
      title,
      rating,
      aired,
      airDate,
      overview,
      thumbnail,
      provider,
      hasDub,
      hasSub,
      // hasRaw,
    };
  }
}
