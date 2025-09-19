import { FetchClient } from '../config/client.js';
import { HiAnime } from '../provider/anime/hianime.js';
import { compareTwoStrings } from '../utils/string-similarity.js';
import type { HiAnimeServers, ISubOrDub, IMovieProviderResults, IMetaData } from './types.js';
import { FlixHQ } from '../provider/movies/flixhq.js';
// import { AllAnime } from '../provider/anime/allanime.js';
// import { Animepahe } from '../provider/anime/animepahe.js';

type AnimeSearchResults = {
  id: string;
  name: string;
  romaji?: string; // pahe lacks this
  provider: string;
  type?: string;
  native?: string;
  season?: string;
  totalEpisodes?: number;
  releaseDate?: number;
};

export interface IMediaTitle {
  name: string | null;
  // TV-specific
  seasons?: number | null;
  totalEpisodes?: number | null;
  // Movie-specific
  releaseDate?: string | null;
  runtime?: number | null;
}

export interface MediaSearchResults {
  id: string;
  name: string | null;
  // TV-specific
  seasons?: number | null;
  totalEpisodes?: number | null;
  // Movie-specific
  releaseDate?: number | null;
  duration?: number | null;
  provider: string | null;
}

export abstract class Meta {
  protected readonly client: FetchClient;
  protected readonly hianime: HiAnime;
  protected readonly flixhq: FlixHQ;
  // protected readonly allanime: AllAnime;
  // protected readonly animepahe: Animepahe;

  protected constructor() {
    this.client = new FetchClient();
    this.client.setProfile('normal-fetch');
    this.hianime = new HiAnime();
    this.flixhq = new FlixHQ();
    // this.allanime = new AllAnime();
    // this.animepahe = new Animepahe();
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

  protected mapAnimeId(
    metadata: IMetaData | null,
    results: AnimeSearchResults[] | null,
    provider: 'pahe' | 'allanime' | 'hianime',
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
      if (provider !== 'pahe' && provider !== 'allanime') {
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
      provider: bestMatch.provider || null,
      score: bestScore,
    };
  }

  protected mapMediaId(
    title: IMediaTitle | null,
    results: MediaSearchResults[] | null,
    mediaType: 'TV' | 'Movie',
  ): IMovieProviderResults | null {
    if (!results || results.length === 0 || !title) {
      return null;
    }

    let bestMatch: MediaSearchResults | null = null;
    let bestScore = 0;

    // Extract year from full date for movies
    const titleYear = mediaType === 'Movie' && title.releaseDate ? this.extractYear(title.releaseDate) : null;

    for (const r of results) {
      let totalScore = 0;
      let weightSum = 0;
      let compared = 0;

      // Title comparison (50% weight for both types)
      if (title.name && r.name) {
        const titleSimilarity = compareTwoStrings(title.name, r.name);
        totalScore += titleSimilarity * 0.5;
        weightSum += 0.5;
        compared++;
      }

      // Type-specific comparisons
      if (mediaType === 'TV') {
        // TV: Seasons comparison (35% weight)
        if (title.seasons !== null && r.seasons !== null) {
          const seasonDiff = Math.abs(Number(title.seasons) - Number(r.seasons));
          const seasonMatch = Math.max(0, 1 - seasonDiff / Math.max(Number(title.seasons), Number(r.seasons)));
          totalScore += seasonMatch * 0.35;
          weightSum += 0.35;
          compared++;
        }

        // TV: Total episodes comparison (15% weight)
        if (title.totalEpisodes !== null && r.totalEpisodes !== null) {
          const episodeDiff = Math.abs(Number(title.totalEpisodes) - Number(r.totalEpisodes));

          const episodeMatch = Math.max(0, 1 - episodeDiff / Math.max(Number(title.totalEpisodes), Number(r.totalEpisodes)));

          totalScore += episodeMatch * 0.15;
          weightSum += 0.15;
          compared++;
        }
      } else if (mediaType === 'Movie') {
        // Movie: Year comparison (35% weight)
        if (titleYear !== null && r.releaseDate !== null) {
          const yearDiff = Math.abs(titleYear - Number(r.releaseDate));
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

          totalScore += yearMatch * 0.35;
          weightSum += 0.35;
          compared++;
        }

        // Movie: Runtime comparison (15% weight)
        if (title.runtime !== null && r.duration !== null) {
          const runtimeDiff = Math.abs(Number(title.runtime) - Number(r.duration));
          let runtimeMatch: number;

          if (runtimeDiff <= 10) {
            runtimeMatch = 1.0;
          } else if (runtimeDiff <= 30) {
            runtimeMatch = 0.7;
          } else if (runtimeDiff <= 60) {
            runtimeMatch = 0.4;
          } else {
            runtimeMatch = 0.1;
          }

          totalScore += runtimeMatch * 0.15;
          weightSum += 0.15;
          compared++;
        }
      }

      if (compared === 0) continue;

      const weightedAvgScore = totalScore / weightSum;

      if (weightedAvgScore > bestScore) {
        bestScore = weightedAvgScore;
        bestMatch = r;
      }
    }

    if (!bestMatch || bestScore < 0.3) {
      return null;
    }

    const result: IMovieProviderResults = {
      id: bestMatch.id,
      name: bestMatch.name || null,
    };

    // Add type-specific fields
    if (mediaType === 'TV') {
      result.seasons = bestMatch.seasons || null;
      result.totalEpisodes = bestMatch.totalEpisodes || null;
      result.provider = bestMatch.provider || null;
      result.score = bestScore;
    } else {
      result.releaseDate = bestMatch.releaseDate || null;
      result.duration = bestMatch.duration + ' ' + 'minutes' || null;
      result.provider = bestMatch.provider || null;
      result.score = bestScore;
    }

    return result;
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
          totalEpisodes: item.totalEpisodes,
          type: item.type,
          provider: 'hianime and kaido',
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
        provider: 'hianime and kaido',
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  protected async fetchZoroSources(episodeId: string, server: HiAnimeServers = 'hd-2', category: ISubOrDub = 'sub') {
    try {
      const result = await this.hianime.fetchSources(episodeId, server, category);

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
          name: item.name,
          seasons: item.seasons,
          totalEpisodes: item.totalEpisodes,
          provider: 'flixhq and himovies',
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
          name: item.name,
          releaseDate: item.releaseDate as number,
          duration: Number(item.duration.replace(/\D/g, '')),
          provider: 'flixhq and himovies',
        }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  // ------------------------
  // AllAnime integration
  // ------------------------

  // protected async searchAllAnime(title: string) {
  //   try {
  //     const result = await this.allanime.search(title);

  //     return (
  //       result.data?.map((item: any) => ({
  //         id: item.id,
  //         name: item.name,
  //         romaji: item.romaji,
  //         native: item.native,
  //         provider: 'allanime',
  //       })) || []
  //     );
  //   } catch (error) {
  //     throw new Error(error instanceof Error ? error.message : String(error));
  //   }
  // }

  // protected async fetchAllAnimeEpisodes(id: string) {
  //   try {
  //     const result = await this.allanime.fetchEpisodes(id);
  //     return result.data.map((item: any) => ({
  //       episodeId: item.episodeId,
  //       episodeNumber: item.episodeNumber,
  //       hasSub: item.hasSub,
  //       hasDub: item.hasDub,
  //       hasRaw: item.hasRaw,
  //       provider: 'allanime',
  //     }));
  //   } catch (error) {
  //     throw new Error(error instanceof Error ? error.message : String(error));
  //   }
  // }
  // protected async fetchAllAnimeSources(episodeId: string, category: ISubOrDub = 'sub') {
  //   try {
  //     const result = await this.allanime.fetchSources(episodeId, category);
  //     return result;
  //   } catch (error) {
  //     throw new Error(error instanceof Error ? error.message : String(error));
  //   }
  // }
  // // ------------------------
  // // Animepahe
  // // ------------------------
  // protected async searchPahe(title: string) {
  //   try {
  //     const result = await this.animepahe.search(title);

  //     return (
  //       result.data?.map((item: any) => ({
  //         id: item.id,
  //         name: item.name,
  //         releaseDate: item.releaseDate,
  //         type: item.type,
  //         season: item.season,
  //         totalEpisodes: item.totalEpisodes,
  //         provider: 'animepahe',
  //       })) || []
  //     );
  //   } catch (error) {
  //     throw new Error(error instanceof Error ? error.message : String(error));
  //   }
  // }
  // protected async fetchPaheEpisodes(title: string) {
  //   try {
  //     const result = await this.animepahe.fetchEpisodes(title);
  //     ////a bit repetitive idk why will refactor
  //     return (
  //       result.data?.map((item: any) => ({
  //         episodeId: item.episodeId,
  //         episodeNumber: item.episodeNumber,
  //         title: item.title,
  //         thumbnail: item.thumbnail,
  //         provider: 'animepahe',
  //       })) || []
  //     );
  //   } catch (error) {
  //     throw new Error(error instanceof Error ? error.message : String(error));
  //   }
  // }

  // protected async fetchPaheSouces(episodeId: string, category: 'sub' | 'dub' | 'raw') {
  //   try {
  //     const result = await this.animepahe.fetchSources(episodeId, category);

  //     return result;
  //   } catch (error) {
  //     throw new Error(error instanceof Error ? error.message : String(error));
  //   }
  // }
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

  protected mergeEpisodeData(providerEp: any, aniZipEp?: any) {
    const episodeNumber = providerEp?.episodeNumber || aniZipEp?.episodeAnizipNumber || null;
    const rating = aniZipEp?.rating || null;
    const aired = aniZipEp?.aired || null;
    const episodeId = providerEp?.episodeId || null;
    const title = aniZipEp?.title?.english || aniZipEp?.title?.romanizedJapanese || providerEp.title || null;
    const overview = aniZipEp?.overview || null;
    const thumbnail = aniZipEp?.image || providerEp.thumbnail || null;
    const provider = providerEp?.provider || null;
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
