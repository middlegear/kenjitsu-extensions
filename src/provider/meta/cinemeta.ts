import { BaseClass } from '../../models/base.js';
import type { IBase, IResponse } from '../../types/base.js';
import type { IKitsuAnime, IKitsuEpisode } from '../../types/meta/meta-anime.js';
import { Kitsu } from './kitsu.js';
import { distance } from 'fastest-levenshtein';

interface ICinemetaEpisode {
  id: string;
  title: string;
  airDate: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  relativeNumber?: number | null;
  thumbnail: string;
  summary: string;
  rating: string;
}

class Cinemeta extends BaseClass {
  private baseUrl: string;

  private static readonly MATCH_THRESHOLD = 0.4;

  constructor(baseUrl: string = 'https://v3-cinemeta.strem.io') {
    super();
    this.baseUrl = baseUrl;
  }

  private async search(query: string, format: string): Promise<IResponse<IBase[] | []>> {
    try {
      const mediaType = format.toLowerCase() === 'movie' ? 'movie' : 'series';

      const response = await this.client.fetch(
        `${this.baseUrl}/catalog/${mediaType}/top/search=${encodeURIComponent(query)}.json`,
        {
          method: 'GET',
        },
      );

      if (!response.ok) {
        return {
          data: [],
          error: response.statusText,
          status: response.status,
        };
      }

      const result = await response.json();
      const data = (result.metas ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        imdbId: item.imdb_id,
        posterImage: item.poster,
        coverImage: item.background,
        type: item.type,
        releaseDate: item.releaseInfo,
      }));

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
        status: 500,
      };
    }
  }

  private async fetchMediaInfo(id: string, format: string) {
    try {
      const mediaType = format.toLowerCase() === 'movie' ? 'movie' : 'series';

      // const response = await this.client.fetch(`${this.baseUrl}/meta/${mediaType}/${id}.json`, {
      //   method: 'GET',
      // });

      // const url = `https://tmdb-discover-plus.elfhosted.com/t5mDdzCuoL/meta/${mediaType}/${id}.json`;
      const url = `https://aiometadata.elfhosted.com/stremio/d6259c47-5162-42ee-a17e-a1b793a9a4e4/meta/${mediaType}/${id}.json`;
      const response = await this.client.fetch(url, { method: 'GET' });


      if (!response.ok) {
        return {
          data: null,
          providerEpisodes: [],
          error: response.statusText,
          status: response.status,
        };
      }

      const result = await response.json();

      const info = {
        id: result.meta.id,
        name: result.meta.name,
        posterImage: result.meta.poster,
        releaseDate: result.meta.released,
        imdbId: result.meta.imdb_id,
        tmdbId: result.meta.moviedb_id,
        tvdbId: result.meta.tvdb_id,
        logo: result.meta.logo,
        coverImage: result.meta.background,
        year: result.meta.year,
      };
  
      const rawVideos: any[] =
        Array.isArray(result.meta.videos) && result.meta.videos.length > 0
          ? result.meta.videos
          : mediaType === 'movie'
            ? [
                {
                  name: result.meta.name,
                  released: result.meta.released,
                  season: 1,
                  number: 1,
                  thumbnail: result.meta.poster ?? result.meta.background,
                  id: result.meta.id,
                  description: result.meta.description,
                  overview: result.meta.overview,
                  rating: result.meta.imdbRating,
                },
              ]
            : [];

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const episodes: ICinemetaEpisode[] = rawVideos
        .map((item: any): ICinemetaEpisode => ({
          title: item.name,
          airDate: item.released || item.firstAired || '',
          seasonNumber: item.season != null ? Number(item.season) : null,
          episodeNumber: item.number != null ? Number(item.number) : null,
          relativeNumber: item.relativeNumber != null ? Number(item.relativeNumber) : null,
          thumbnail: item.thumbnail,
          id: item.id,
          summary: item.description || item.overview || '',
          rating: item.rating,
        }))
        .filter(episode => {
          if (!episode.airDate) {
            return false;
          }

          const airDate = new Date(episode.airDate);

          if (Number.isNaN(airDate.getTime())) {
            return false;
          }

          return airDate <= today;
        });

      return {
        data: info,
        providerEpisodes: episodes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: null,
        providerEpisodes: [],
        status: 500,
      };
    }
  }

  /**
   * Resolve a Kitsu anime to a Cinemeta series and build
   * the episode list using Kitsu as the boundary/source
   * for the anime entry.
   *
   */
  async fetchAnimeEpisodes(kitsuId: number): Promise<IResponse<IKitsuEpisode[] | []>> {
    try {
      const kitsu = new Kitsu();

      const info = await kitsu.fetchInfo(kitsuId);

      if (!info.data) {
        return {
          error: info.error ?? 'Could not resolve anime info',
          data: [],
          status: info.status ?? 404,
        };
      }

      const anime = info.data;

      const format = anime.format ?? 'TV';

      const candidateTitles = [
        anime.title.english,
        anime.title.romaji,
        anime.title.native,
        ...(anime.synonyms ?? []),
      ].filter((title): title is string => Boolean(title && title.trim()));

      if (candidateTitles.length === 0) {
        return {
          error: 'No usable Kitsu titles to search Cinemeta with',
          data: [],
          status: 404,
        };
      }

      const searchQuery = anime.title.english ?? anime.title.romaji ?? candidateTitles[0];

      const searchResult = await this.search(searchQuery, format);

      if (!searchResult.data || searchResult.data.length === 0) {
        return {
          error: 'No Cinemeta match found',
          data: [],
          status: 404,
        };
      }

      const match = this.pickBestMatch(searchResult.data, candidateTitles);
      if (!match) {
        return {
          error: 'No confident Cinemeta match found',
          data: [],
          status: 404,
        };
      }

      const mediaInfo = await this.fetchMediaInfo(match.id as string, format);

      if (!mediaInfo.data || !mediaInfo.providerEpisodes || mediaInfo.providerEpisodes.length === 0) {
        return {
          error: mediaInfo.error ?? 'No Cinemeta episodes found',
          data: [],
          status: mediaInfo.status ?? 404,
        };
      }

      const episodes =
        format.toLowerCase() === 'movie'
          ? (mediaInfo.providerEpisodes as ICinemetaEpisode[])
          : this.selectEpisodesInRange(mediaInfo.providerEpisodes as ICinemetaEpisode[], anime);

      if (episodes.length === 0) {
        return {
          error: 'No Cinemeta episodes fall within the Kitsu episode range',
          data: [],
          status: 404,
        };
      }

      const data: IKitsuEpisode[] = episodes.map((video, index) => ({
        episodeId: video.id ?? `${mediaInfo.data!.id}:${video.seasonNumber ?? 1}:${video.episodeNumber ?? index + 1}`,

        thumbnail: video.thumbnail ?? null,

        title: video.title ?? `Episode ${index + 1}`,

        airDate: video.airDate ?? null,

        seasonNumber: video.seasonNumber ?? 1,

        episodeNumber: video.episodeNumber ?? index + 1,

        relativeNumber: video.relativeNumber ?? index + 1,

        synopsis: video.summary ?? null,
      }));

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
        status: 500,
      };
    }
  }

  /**
   * Select the Cinemeta episodes belonging to the
   * specific Kitsu anime entry.
   *
   * Rules:
   *
   * TV:
   *   - Only season 1+.
   *   - Season 0 is treated as specials.
   *
   * Start:
   *   - Kitsu releaseDate.
   *
   * End:
   *   - Kitsu endDate when available.
   *   - Otherwise today for currently airing anime.
   *
   * Count:
   *   - Kitsu's episode count is the maximum number
   *     of episodes returned.
   *
   * Cinemeta's own:
   *   - seasonNumber
   *   - episodeNumber
   *   - relativeNumber
   *
   * are preserved rather than reconstructed.
   */
  // private selectEpisodesInRange(videos: ICinemetaEpisode[], anime: IKitsuAnime): ICinemetaEpisode[] {
  //   const format = (anime.format ?? 'TV').toUpperCase();
  //
  //   const status = (anime.status ?? '').toLowerCase();
  //
  //   let filtered = [...videos];
  //
  //   /*
  //    * TV anime:
  //    *
  //    * Cinemeta can expose specials using an ID like:
  //    *
  //    *   tt0434665:0:1
  //    *
  //    * while incorrectly reporting seasonNumber as 1.
  //    *
  //    * Therefore the ID is the authoritative source for
  //    * determining whether the Cinemeta entry is season 0.
  //    */
  //   if (format === 'TV') {
  //     filtered = filtered.filter(video => {
  //       const parts = video.id.split(':');
  //
  //       const season = Number(parts[1]);
  //
  //       return Number.isFinite(season) && season >= 1;
  //     });
  //   }
  //
  //   /*
  //    * Kitsu releaseDate is the beginning of this
  //    * anime's episode range.
  //    */
  //   const startDate = anime.releaseDate ? new Date(anime.releaseDate) : null;
  //
  //   if (!startDate || Number.isNaN(startDate.getTime())) {
  //     return [];
  //   }
  //
  //   startDate.setHours(0, 0, 0, 0);
  //
  //   /*
  //    * Kitsu endDate is preferred.
  //    *
  //    * If the anime is currently airing and Kitsu
  //    * doesn't have an endDate yet, today becomes
  //    * the effective end of the range.
  //    */
  //   let endDate: Date | null = anime.endDate ? new Date(anime.endDate) : null;
  //
  //   if (!endDate && status === 'current') {
  //     endDate = new Date();
  //   }
  //
  //   if (endDate && Number.isNaN(endDate.getTime())) {
  //     endDate = null;
  //   }
  //
  //   if (endDate) {
  //     endDate.setHours(23, 59, 59, 999);
  //   }
  //
  //   /*
  //    * Apply the Kitsu date window.
  //    */
  //   filtered = filtered.filter(video => {
  //     if (!video.airDate) {
  //       return false;
  //     }
  //
  //     const airDate = new Date(video.airDate);
  //
  //     if (Number.isNaN(airDate.getTime())) {
  //       return false;
  //     }
  //
  //     /*
  //      * Episode must not occur before
  //      * the Kitsu anime start date.
  //      */
  //     if (airDate < startDate) {
  //       return false;
  //     }
  //
  //     /*
  //      * Episode must not occur after
  //      * the Kitsu anime end date, or today
  //      * for a current anime without an endDate.
  //      */
  //     if (endDate && airDate > endDate) {
  //       return false;
  //     }
  //
  //     return true;
  //   });
  //
  //   /*
  //    * Deduplicate using Cinemeta's actual
  //    * season/episode identity.
  //    */
  //   filtered = this.dedupeBySeasonEpisode(filtered);
  //
  //   /*
  //    * Cinemeta's relativeNumber represents the
  //    * continuous numbering across seasons.
  //    *
  //    * Use it when available because it is more
  //    * appropriate for long-running anime such as
  //    * Bleach than calculating a new number from
  //    * the filtered array.
  //    *
  //    * Fall back to airDate when relativeNumber
  //    * isn't available.
  //    */
  //   filtered.sort((a, b) => {
  //     if (a.relativeNumber != null && b.relativeNumber != null) {
  //       return a.relativeNumber - b.relativeNumber;
  //     }
  //
  //     if (a.relativeNumber != null) {
  //       return -1;
  //     }
  //
  //     if (b.relativeNumber != null) {
  //       return 1;
  //     }
  //
  //     return new Date(a.airDate).getTime() - new Date(b.airDate).getTime();
  //   });
  //
  //   /*
  //    * Kitsu's episode count is the maximum number
  //    * of episodes belonging to this anime entry.
  //    *
  //    * For a current anime:
  //    *
  //    *   Kitsu episodes = 10
  //    *   Cinemeta aired = 3
  //    *
  //    * result = 3
  //    *
  //    * Future episodes have already been removed by
  //    * the effective end date.
  //    */
  //   if (anime.episodes && anime.episodes > 0) {
  //     filtered = filtered.slice(0, anime.episodes);
  //   }
  //
  //   return filtered;
  // }
  private selectEpisodesInRange(videos: ICinemetaEpisode[], anime: IKitsuAnime): ICinemetaEpisode[] {
    const format = (anime.format ?? 'TV').toUpperCase();

    const parseId = (id: string): { season: number; episode: number } | null => {
      const parts = id.split(':');
      const season = Number(parts[1]);
      const episode = Number(parts[2]);
      if (!Number.isFinite(season) || !Number.isFinite(episode)) return null;
      return { season, episode };
    };

    const all = videos.filter(v => {
      const p = parseId(v.id);
      if (!p) return false;
      if (format === 'TV' && p.season < 1) return false;
      return true;
    });

    if (all.length === 0) return [];

    const bySeason = new Map<number, ICinemetaEpisode[]>();
    for (const v of all) {
      const season = parseId(v.id)!.season;
      if (!bySeason.has(season)) bySeason.set(season, []);
      bySeason.get(season)!.push(v);
    }

    interface SeasonStats {
      season: number;
      min: Date;
      max: Date;
    }
    const seasonStats: SeasonStats[] = [];

    for (const [season, eps] of bySeason) {
      let min: Date | null = null;
      let max: Date | null = null;
      for (const e of eps) {
        if (!e.airDate) continue;
        const d = new Date(e.airDate);
        if (Number.isNaN(d.getTime())) continue;
        if (!min || d < min) min = d;
        if (!max || d > max) max = d;
      }
      if (min && max) seasonStats.push({ season, min, max });
    }

    if (seasonStats.length === 0) return [];
    seasonStats.sort((a, b) => a.season - b.season);

    const closestSeasonTo = (target: Date): number => {
      let best = seasonStats[0].season;
      let bestDist = Infinity;
      for (const s of seasonStats) {
        let dist: number;
        if (target >= s.min && target <= s.max) dist = 0;
        else if (target < s.min) dist = s.min.getTime() - target.getTime();
        else dist = target.getTime() - s.max.getTime();
        if (dist < bestDist) {
          bestDist = dist;
          best = s.season;
        }
      }
      return best;
    };

    const startDate = anime.releaseDate ? new Date(anime.releaseDate) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) return [];

    const startSeason = closestSeasonTo(startDate);

    let endSeason: number;

    if (anime.endDate) {
      const endDate = new Date(anime.endDate);
      endSeason = !Number.isNaN(endDate.getTime()) ? closestSeasonTo(endDate) : seasonStats[seasonStats.length - 1].season;
    } else if (anime.episodes && anime.episodes > 0) {
      let remaining = anime.episodes;
      endSeason = startSeason;

      for (const s of seasonStats) {
        if (s.season < startSeason) continue;

        const count = (bySeason.get(s.season) ?? []).length;
        endSeason = s.season;

        if (remaining <= count) break;
        remaining -= count;
      }
    } else {
      endSeason = seasonStats[seasonStats.length - 1].season;
    }

    if (endSeason < startSeason) endSeason = startSeason;
    let filtered = all.filter(v => {
      const { season } = parseId(v.id)!;
      return season >= startSeason && season <= endSeason;
    });

    filtered = this.dedupeBySeasonEpisode(filtered);

    filtered.sort((a, b) => {
      const pa = parseId(a.id)!;
      const pb = parseId(b.id)!;
      if (pa.season !== pb.season) return pa.season - pb.season;
      return pa.episode - pb.episode;
    });

    return filtered;
  }
  /**
   * Remove duplicate season/episode records.
   */
  private dedupeBySeasonEpisode(videos: ICinemetaEpisode[]): ICinemetaEpisode[] {
    const bestByKey = new Map<string, ICinemetaEpisode>();

    const unkeyed: ICinemetaEpisode[] = [];

    for (const video of videos) {
      const parts = video.id.split(':');

      const season = parts[1];
      const episode = parts[2];

      if (!season || !episode) {
        unkeyed.push(video);
        continue;
      }

      const key = `${season}:${episode}`;

      const existing = bestByKey.get(key);

      if (!existing) {
        bestByKey.set(key, video);
        continue;
      }

      /*
       * If duplicate records exist, keep the one
       * with the earlier valid air date.
       */
      const currentDate = new Date(video.airDate).getTime();

      const existingDate = new Date(existing.airDate).getTime();

      if (!Number.isNaN(currentDate) && !Number.isNaN(existingDate) && currentDate < existingDate) {
        bestByKey.set(key, video);
      }
    }

    return [...bestByKey.values(), ...unkeyed];
  }

  /**
   * Find the closest Cinemeta title against
   * all Kitsu titles and synonyms.
   */
  private pickBestMatch(candidates: IBase[], titles: string[]): IBase | null {
    if (candidates.length === 0) {
      return null;
    }

    const normalizedTitles = titles.map(title => title.toLowerCase().trim()).filter(Boolean);

    if (normalizedTitles.length === 0) {
      return null;
    }

    let best: IBase | null = null;

    let bestScore = Infinity;

    for (const candidate of candidates) {
      const name = candidate.name?.toLowerCase().trim();

      if (!name) {
        continue;
      }

      for (const title of normalizedTitles) {
        const rawDistance = distance(name, title);

        const normalized = rawDistance / Math.max(name.length, title.length, 1);

        if (normalized < bestScore) {
          bestScore = normalized;

          best = candidate;
        }
      }
    }

    return bestScore <= Cinemeta.MATCH_THRESHOLD ? best : null;
  }
}

export { Cinemeta };
