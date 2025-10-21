import { FetchClient } from '../config/client.js';
import { AllAnime } from '../provider/anime/allanime.js';
import { Anizone } from '../provider/anime/anizone.js';
import { HiAnime } from '../provider/anime/hianime.js';
import { Animepahe } from '../provider/anime/animepahe.js';
import type { IMetaDataMap } from '../types/meta/meta-anime.js';
import { compareTwoStrings } from '../utils/string-similarity.js';

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

export abstract class BaseAnimeMeta {
  protected client: FetchClient;
  protected allanime: AllAnime;
  protected anizone: Anizone;
  protected hianime: HiAnime;
  protected animepahe: Animepahe;

  constructor(provider: 'jikan' | 'anilist') {
    let delay = null;
    if (provider === 'jikan') {
      delay = 700;
    } else {
      delay = 200;
    }
    this.client = new FetchClient({ delayBetweenRequests: delay });

    this.allanime = new AllAnime();
    this.hianime = new HiAnime();
    this.animepahe = new Animepahe();
    this.anizone = new Anizone();
  }

  protected createTitleSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected mapAnimeProviderId(
    metadata: IMetaDataMap | null,
    results: AnimeSearchResults[] | null,
    provider: 'pahe' | 'allanime' | 'hianime' | 'anizone',
  ) {
    if (!results || results.length === 0 || !metadata) {
      return null;
    }

    let bestMatch: AnimeSearchResults | null = null;
    let bestScore = 0;

    for (const r of results) {
      let totalScore = 0;
      let compared = 0;

      // Compare English if both present
      if (metadata.english && r.name) {
        totalScore += compareTwoStrings(metadata.english, r.name);
        compared++;
      }

      // Compare Romaji if both present
      if (metadata.romaji && r.romaji) {
        totalScore += compareTwoStrings(metadata.romaji, r.romaji);
        compared++;
      }

      // Compare Native if both present
      if (metadata.native && r.native) {
        totalScore += compareTwoStrings(metadata.native, r.native);
        compared++;
      }

      // Compare type if both present
      if (metadata.type && r.type) {
        totalScore += compareTwoStrings(metadata.type, r.type);
        compared++;
      }

      // /// Additionally compare the id
      if (provider !== 'pahe' && provider !== 'allanime' && provider != 'anizone') {
        if (metadata.english && r.id) {
          totalScore += compareTwoStrings(metadata.english, r.id);
          compared++;
        }
      }

      if (metadata.season && r.season) {
        totalScore += compareTwoStrings(metadata.season, r.season);
        compared++;
      }

      if (metadata.episodes && r.totalEpisodes) {
        const episodeDiff = Math.abs(Number(metadata.episodes) - Number(r.totalEpisodes));

        const episodeMatch = Math.max(0, 1 - episodeDiff / Math.max(Number(metadata.episodes), Number(r.totalEpisodes)));
        totalScore += episodeMatch;

        compared++;
      }

      if (metadata.year && r.releaseDate) {
        const yearDiff = Math.abs(metadata.year - Number(r.releaseDate));
        let yearMatch: number;

        if (yearDiff === 0) {
          yearMatch = 1.0;
        } else if (yearDiff === 1) {
          yearMatch = 0.8;
        } else if (yearDiff === 2) {
          yearMatch = 0.5;
        } else {
          yearMatch = 0.2;
        }

        totalScore += yearMatch;
        compared++;
      }
      // Skip if nothing was compared
      if (compared === 0) continue;

      const avgScore = totalScore / compared;

      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestMatch = r;
      }
    }

    if (!bestMatch) {
      return null;
    }

    return {
      id: bestMatch.id,
      name: bestMatch.name || null,
      romaji: bestMatch.romaji || null,
      provider: provider || null,
      score: bestScore,
    };
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
  // ------------------------
  // Anizip integration
  // ------------------------
  protected formatAnizipData(data: any) {
    if (!data || !data.episodes) {
      return { animeTitles: {}, mappings: {}, episodes: [] };
    }

    const titles = {
      english: data.titles?.en || null,
      japanese: data.titles?.ja || null,
      german: data.titles?.de || null,
      romanizedJapanese: data.titles?.['x-jat'] || null,
      traditionalChinese: data.titles?.['zh-Hant'] || null,
      simplifiedChinese: data.titles?.['zh-Hans'] || null,
    };

    const mappings = {
      animePlanetId: data.mappings?.animeplanet_id || null,
      kitsuId: data.mappings?.kitsu_id || null,
      malId: data.mappings?.mal_id || null,
      anilistId: data.mappings?.anilist_id || null,
      anisearchId: data.mappings?.anisearch_id || null,
      anidbId: data.mappings?.anidb_id || null,
      notifymoeId: data.mappings?.notifymoe_id || null,
      livechartId: data.mappings?.livechart_id || null,
      imdbId: data.mappings?.imdb_id || null,
      themoviedbId: data.mappings?.themoviedb_id || null,
    };

    const episodeKeys = Object.keys(data.episodes);

    const transformedEpisodes = episodeKeys
      .filter(key => /^\d+$/.test(key))
      .map(key => {
        const episode = data.episodes[key];
        return {
          episodeAnizipNumber: Number(episode.episode || episode.episodeNumber) || null,
          title: {
            english: episode.title?.en || episode.title?.['x-jat'] || null,
            japanese: episode.title?.ja || null,
            german: episode.title?.de || null,
            romanizedJapanese: episode.title?.['x-jat'] || null,
          },
          airDate: episode.airDate || episode.airdate,
          runtime: episode.runtime || episode.length,
          overview: episode.overview || episode.summary,
          image: episode.image || null,
          rating: episode.rating || null,
          aired: true,
        };
      });

    const images = data.images || null;
    return {
      images,
      titles,
      mappings,
      episodes: transformedEpisodes,
    };
  }

  protected anilistAnizip(id: number) {
    return this.fetchAnizipByMapping('anilist_id', id);
  }

  protected malAnizip(id: number) {
    return this.fetchAnizipByMapping('mal_id', id);
  }

  protected mergeEpisodeData(providerEp: any, aniZipEp: any, provider: string) {
    const episodeNumber = providerEp.episodeNumber || aniZipEp.episodeAnizipNumber || null;
    const rating = aniZipEp?.rating || null;
    const aired = aniZipEp?.aired || null;
    const episodeId = providerEp?.episodeId || null;
    const title = aniZipEp?.title?.english || aniZipEp?.title?.romanizedJapanese || providerEp.title || null;
    const overview = aniZipEp?.overview || null;
    const thumbnail = aniZipEp?.image || providerEp.thumbnail || null;
    const hasDub = providerEp.hasDub || null;
    const hasSub = providerEp.hasDub || null;
    // const hasRaw = providerEp.hasDub || null; disabled since i cant fetch raw sources from allanime

    return {
      episodeNumber,
      episodeId,
      title,
      rating,
      aired,
      overview,
      thumbnail,
      provider,
      // hasDub,
      // hasSub,
      // hasRaw,
    };
  }

  protected async fetchAnizipByMapping(type: 'anilist_id' | 'mal_id', id: number) {
    if (!id) return { error: `Missing required param: ${type}`, data: null };

    try {
      const response = await this.client.get(`https://api.ani.zip/mappings?${type}=${id}`);
      if (!response.data) throw new Error(response.statusText);

      const results = this.formatAnizipData(response.data);
      return {
        images: results.images,
        titles: results.titles,
        episodes: results.episodes,
        mapping: results.mappings,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
}
