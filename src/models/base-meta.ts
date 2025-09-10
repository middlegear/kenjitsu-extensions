import { FetchClient } from '../config/client.js';
import { HiAnime } from '../provider/anime/hianime.js';
import { findBestMatch } from '../utils/string-similarity.js';
import type { HiAnimeServers, HISubOrDub, IMovieProviderResults, ITitle } from './types.js';
import { FlixHQ } from '../provider/movies/flixhq/index.js';
import { AllAnime } from '../provider/anime/allanime.js';

type AnimeSearchResults = {
  id: string;
  name: string;
  romaji: string;
  provider: string;
  native?: string;
  episodes?: {
    sub: number;
    dub: number;
  };
};

// Union type for the generic parameter

export abstract class Meta {
  protected readonly client: FetchClient;
  protected readonly hianime: HiAnime;
  protected readonly flixhq: FlixHQ;
  protected readonly allanime: AllAnime;

  protected constructor() {
    this.client = new FetchClient();
    this.client.setProfile('normal-fetch');
    this.hianime = new HiAnime();
    this.flixhq = new FlixHQ();
    this.allanime = new AllAnime();
  }

  // ------------------------
  // Utilities
  // ------------------------
  protected createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected mapMovies(title: string, results: IMovieProviderResults[]) {
    if (!results.length) return null;

    const normalizedResults = results.map(item => ({
      ...item,
      _title: item.title,
      _id: item.id,
    }));

    const findTitle = findBestMatch(
      title,
      normalizedResults.map(r => r._title),
    );
    const findId = findBestMatch(
      title,
      normalizedResults.map(r => r._id),
    );

    const bestOverallMatch = findTitle.bestMatch.rating >= findId.bestMatch.rating ? findTitle.bestMatch : findId.bestMatch;

    if (bestOverallMatch.rating === 0) {
      return [];
    }

    const matches = normalizedResults.filter(r => {
      const isTitleMatch = r._title === bestOverallMatch.target && findTitle.bestMatch.rating === bestOverallMatch.rating;
      const isIdMatch = r._id === bestOverallMatch.target && findId.bestMatch.rating === bestOverallMatch.rating;
      return isTitleMatch || isIdMatch;
    });

    if (matches.length > 0) {
      return matches.map(match => ({
        id: match.id || null,
        title: match.title || null,
        quality: match.quality || null,
        url: match.url || null,
        releaseDate: match.releaseDate || null,
        score: bestOverallMatch.rating,
      }));
    } else {
      return null;
    }
  }

  protected mapAnimeId(title: ITitle, results: AnimeSearchResults[]) {
    if (!results.length) return null;

    const normalizedResults = results.map(item => ({
      ...item,
      _name: item.name,
      _romaji: item.romaji,
    }));

    const englishMatch = findBestMatch(
      title.english,
      normalizedResults.map(r => r._name),
    );

    const romajiMatch = findBestMatch(
      title.romaji,
      normalizedResults.map(r => r._romaji),
    );

    const best =
      englishMatch.bestMatch.rating >= romajiMatch.bestMatch.rating ? englishMatch.bestMatch : romajiMatch.bestMatch;

    const match = normalizedResults.find(r => r._name === best.target || r._romaji === best.target);

    return match
      ? {
          id: match.id,
          name: match.name || null,
          romaji: match.romaji || null,
          provider: match.provider || null,
          episodes: match.episodes || null,
          score: best.rating,
        }
      : null;
  }

  // ------------------------
  // HiAnime integration
  // ------------------------
  protected async searchZoro(title: string) {
    try {
      const result = await this.hianime.search(title);
      return (
        result.data?.map((item: any) => ({
          id: item.id,
          name: item.name,
          romaji: item.romaji,
          episodes: item.episodes,
          provider: 'hianime',
        })) || []
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  protected async fetchZoroEpisodes(id: string) {
    try {
      const result = await this.hianime.fetchEpisodes(id);
      return result.data.map((item: any) => ({
        episodeId: `hianime-${item.episodeId}`,
        episodeNumber: item.episodeNumber,
        title: item.title,
        provider: 'hianime',
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  protected async fetchZoroSources(episodeId: string, server: HiAnimeServers = 'hd-2', category: HISubOrDub = 'sub') {
    try {
      const result = await this.hianime.fetchSources(episodeId, server, category);
      if ('error' in result) {
        throw new Error(result.error);
      }
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  // ------------------------
  // FlixHQ integration
  // ------------------------
  protected async searchFlixTv(query: string) {
    try {
      const result = await this.flixhq.search(query);

      return result.data
        .filter((item: any) => item.type === 'TV')
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          seasons: item.seasons,
          quality: item.quality,
        }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  protected async searchFlixMovies(query: string) {
    try {
      const result = await this.flixhq.search(query);

      return result.data
        .filter((item: any) => item.type === 'Movie')
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          releaseDate: item.releaseDate,
          quality: item.quality,
        }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  // ------------------------
  // AllAnime integration
  // ------------------------

  protected async searchAllAnime(title: string) {
    try {
      const result = await this.allanime.search(title);

      return (
        result.data?.map((item: any) => ({
          id: item.id,
          name: item.name,
          romaji: item.romaji,
          native: item.native,
          provider: 'allanime',
        })) || []
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  protected async fetchAllAnimeEpisodes(id: string) {
    try {
      const result = await this.allanime.fetchEpisodes(id);
      return result.data.map((item: any) => ({
        episodeId: item.episodeId,
        episodeNumber: item.episodeNumber,
        hasSub: item.hasSub,
        hasDub: item.hasDub,
        hasRaw: item.hasRaw,
        provider: 'allanime',
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
  protected async fetchAllAnimeSources(episodeId: string, category: HISubOrDub = 'sub') {
    try {
      const result = await this.allanime.fetchSources(episodeId, category);

      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
  // ------------------------
  // Anizip integration
  // ------------------------
  protected formatAnizipData(data: any) {
    if (!data || !data.episodes) {
      return { animeTitles: {}, mappings: {}, episodes: [] };
    }

    const titles = {
      english: data.titles?.en || data.titles?.['x-jat'] || null,
      japanese: data.titles?.ja || null,
      german: data.titles?.de || null,
      romanizedJapanese: data.titles?.['x-jat'] || null,
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
          image: episode.image || 'No image available',
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

  protected mergeEpisodeData(providerEp: any, aniZipEp?: any) {
    const episodeNumber = aniZipEp?.episodeAnizipNumber ?? providerEp?.episodeNumber ?? null;
    const rating = aniZipEp?.rating ?? null;
    const aired = aniZipEp?.aired ?? null;
    const episodeId = providerEp?.episodeId ?? null;
    const title = aniZipEp?.title?.english ?? aniZipEp?.title?.romanizedJapanese ?? null;
    const overview = aniZipEp?.overview ?? null;
    const thumbnail = aniZipEp?.image ?? null;
    const provider = providerEp?.provider ?? null;
    const hasDub = providerEp.hasDub || null;
    const hasSub = providerEp.hasDub || null;
    // const hasRaw = providerEp.hasDub || null; disabled since i cant fetch raw sources from allanime

    return {
      episodeNumber,
      rating,
      aired,
      episodeId,
      title,
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
