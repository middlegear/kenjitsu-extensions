import { Anizone } from '../provider/anime/anizone.js';

import type { IMetaMovieEpisodes } from '../types/meta/meta-movie.js';
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
  protected createTitleSlugV2(text: string): string {
    return text
      .toLowerCase()
      .replace(/:/g, '-')
      .replace(/;/g, '-')
      .replace(/[\s_-]+/g, '-')
      .replace(/\s+/g, '-')
      .trim();
  }

  // ------------------------
  protected formatAnizipData(data: any) {
    if (!data || !data.episodes) {
      return { animeTitles: {}, mappings: {}, episodes: [] };
    }

    const titles = {
      english: data.titles?.en || null,
      japanese: data.titles?.ja || null,
      german: data.titles?.de || null,
      romanized: data.titles?.['x-jat'] || data.titles?.['x-zht'] || data.titles?.['x-kot'] || null, // i shouldnt be putting x-zht here cause its chinese
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

    const todayStr = new Date().toISOString().slice(0, 10);

    const transformedEpisodes = episodeKeys
      .filter(key => /^\d+$/.test(key))
      .map(key => {
        const episode = data.episodes[key];
        const rawAirDate = episode.airDate || episode.airdate;

        return {
          episodeAnizipNumber: Number(episode.episode || episode.episodeNumber) || null,
          title: {
            english: episode.title?.en || episode.title?.['x-jat'] || null,
            japanese: episode.title?.ja || null,
            german: episode.title?.de || null,
            romanizedJapanese: episode.title?.['x-jat'] || null,
          },
          airDate: rawAirDate,
          runtime: episode.runtime || episode.length,
          overview: episode.overview || episode.summary,
          image: episode.image || null,
          rating: episode.rating ? Number(episode.rating) : null,
          aired: rawAirDate ? rawAirDate.slice(0, 10) <= todayStr : false,
        };
      })
      .filter(episode => episode.aired === true);
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

  protected mergeEpisodeData(providerEp: any, aniZipEp: any, tmdb: IMetaMovieEpisodes, provider: string) {
    const episodeNumber = providerEp.episodeNumber || tmdb?.absoluteEpisodeNumber || aniZipEp?.episodeAnizipNumber || null;
    const rating = tmdb?.rating || aniZipEp?.rating || null;
    const aired = aniZipEp?.aired || null;
    const episodeId = providerEp?.episodeId || providerEp.id || null;
    const title = tmdb?.title || aniZipEp?.title?.english || aniZipEp?.title?.romanizedJapanese || providerEp?.title || null;
    const overview = tmdb?.summary || aniZipEp?.overview || null;
    const thumbnail =
      tmdb?.images?.large ||
      tmdb?.images?.original ||
      providerEp?.teaser ||
      providerEp?.thumbnail ||
      aniZipEp?.image ||
      null;
    const airDate = tmdb?.airDate || providerEp?.airDate || aniZipEp?.airDate || null;
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

  protected async fetchAnizipByMapping(type: 'anilist_id' | 'mal_id', id: number) {
    if (!id) return { error: `Missing required param: ${type}`, data: null };

    try {
      const response = await this.client.fetch(`https://api.ani.zip/mappings?${type}=${id}`, { method: 'GET' });
      if (!response.ok) throw new Error(response.statusText);
      const result = await response.json();
      const results = this.formatAnizipData(result);
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
export { BaseAnimeMeta };
