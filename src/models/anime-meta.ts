import { Anizone } from '../provider/anime/anizone.js';
import { Animepahe } from '../provider/anime/animepahe.js';
import { BaseClass, type ClientConfig } from './base.js';
import type { IMetaMovieEpisodes } from '../types/meta/meta-movie.js';
import { Anikoto } from '../provider/anime/anikoto.js';

abstract class BaseAnimeMeta extends BaseClass {
  protected anizone: Anizone;
  protected anikoto: Anikoto;
  protected animepahe: Animepahe;

  constructor(
    options: ClientConfig = {
      browser: 'firefox144',
      http3: false,
    },
  ) {
    super(options);

    this.animepahe = new Animepahe();
    this.anizone = new Anizone();
    this.anikoto = new Anikoto();
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
  // ------------------------
  // Anizip integration

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
    const episodeId = providerEp?.episodeId || null;
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
