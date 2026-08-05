import { BaseClass } from '../../models/base.js';
import type { ClientOptions } from '../../config/client.js';
import type { IResponse } from '../../types/base.js';
import type { IKitsuAnime, IKitsuEpisode, IProviderId, IRelatedKitsuData } from '../../types/meta/meta-anime.js';

/**
 * Client for interacting with the Kitsu.io anime API.
 *
 * Provides methods to search for anime, fetch detailed information,
 * retrieve episode lists, resolve AniList ↔ Kitsu mappings, and
 * traverse franchise timelines (prequels / sequels).
 *
 */
class Kitsu extends BaseClass {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://kitsu.io/api/edge', options: ClientOptions = { browser: 'okhttp4' }) {
    super(options);
    this.baseUrl = baseUrl;
  }

  /**
   * Searches for anime by free-text query.
   *
   * @param query - Search string (title, synonym, etc.).
   * @returns A response containing an array of matching {@link IKitsuAnime}
   *          objects, or an empty array on failure.
   */
  async search(query: string): Promise<IResponse<IKitsuAnime[] | []>> {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime?filter[text]=${query}`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          error: response.statusText,
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();
      const data = result.data.map((item: any) => {
        const a = item.attributes;

        return {
          kitsuId: Number(item.id),

          isAdult: a.nsfw,
          slug: a.slug,
          image:
            a.posterImage?.original ??
            a.posterImage?.large ??
            a.posterImage?.medium ??
            a.posterImage?.small ??
            a.posterImage?.tiny,

          bannerImage: a.coverImage?.original ?? a.coverImage?.large ?? a.coverImage?.small ?? a.coverImage?.tiny,

          title: {
            romaji: a.titles?.en_jp ?? a.canonicalTitle ?? null,
            english: a.titles?.en ?? null,
            native: a.titles?.ja_jp ?? null,
          },

          trailer: a.youtubeVideoId
            ? {
                id: a.youtubeVideoId,
                site: 'youtube',
              }
            : null,

          format: a.showType ?? a.subtype,

          synonyms: a.abbreviatedTitles ?? [],

          status: a.status,

          releaseDate: a.startDate,
          endDate: a.endDate,

          duration: a.episodeLength,
          episodes: a.episodeCount,

          score: a.averageRating ? Number(a.averageRating) : null,

          synopsis: a.synopsis ?? a.description,
        };
      });

      return {
        data: data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: [],
        status: 500,
      };
    }
  }

  /**
   * Looks up an anime by its exact Kitsu slug.
   *
   * @param query - The slug string (e.g. `'cowboy-bebop'`).
   * @returns A response containing matching {@link IKitsuAnime} entries,
   *          or an empty array on failure.
   */
  async searchSlug(query: string): Promise<IResponse<IKitsuAnime | []>> {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime?filter[slug]=${query}`, {
        method: 'GET',
      });
      if (!response.ok) {
        return {
          error: response.statusText,
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();
      const data = result.data.map((item: any) => {
        const a = item.attributes;

        return {
          kitsuId: Number(item.id),

          isAdult: a.nsfw,
          slug: a.slug,
          image:
            a.posterImage?.original ??
            a.posterImage?.large ??
            a.posterImage?.medium ??
            a.posterImage?.small ??
            a.posterImage?.tiny,

          bannerImage: a.coverImage?.original ?? a.coverImage?.large ?? a.coverImage?.small ?? a.coverImage?.tiny,

          title: {
            romaji: a.titles?.en_jp ?? a.canonicalTitle ?? null,
            english: a.titles?.en ?? null,
            native: a.titles?.ja_jp ?? null,
          },

          trailer: a.youtubeVideoId
            ? {
                id: a.youtubeVideoId,
                site: 'youtube',
              }
            : null,

          format: a.showType ?? a.subtype,

          synonyms: a.abbreviatedTitles ?? [],

          status: a.status,

          releaseDate: a.startDate,
          endDate: a.endDate,

          duration: a.episodeLength,
          episodes: a.episodeCount,

          score: a.averageRating ? Number(a.averageRating) : null,

          synopsis: a.synopsis ?? a.description,
        };
      });

      return {
        data: data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: [],
        status: 500,
      };
    }
  }

  /**
   * Fetches full metadata for a single anime by its Kitsu ID.
   *
   * @param id - Numeric Kitsu anime ID.
   * @returns A response containing the {@link IKitsuAnime} object,
   *          or `null` on failure.
   */
  async fetchInfo(id: number): Promise<IResponse<IKitsuAnime | null>> {
    try {
      const response = await this.client.fetch(`${this.baseUrl}/anime/${id}`, { method: 'GET' });
      if (!response.ok) {
        return {
          data: null,
          error: response.statusText,
          status: response.status,
        };
      }

      const result = await response.json();

      const a = result.data.attributes;
      const data = {
        kitsuId: Number(result.data.id),
        isAdult: a.nsfw,
        slug: a.slug,
        image:
          a.posterImage?.original ??
          a.posterImage?.large ??
          a.posterImage?.medium ??
          a.posterImage?.small ??
          a.posterImage?.tiny ??
          null,
        bannerImage: a.coverImage?.original ?? a.coverImage?.large ?? a.coverImage?.small ?? a.coverImage?.tiny ?? null,
        title: {
          romaji: a.titles?.en_jp ?? a.canonicalTitle ?? null,
          english: a.titles?.en ?? null,
          native: a.titles?.ja_jp ?? null,
        },

        trailer: a.youtubeVideoId
          ? {
              id: a.youtubeVideoId,
              site: 'youtube',
            }
          : null,
        format: a.showType ?? a.subtype,
        synonyms: a.abbreviatedTitles ?? [],
        status: a.status,
        releaseDate: a.startDate,
        endDate: a.endDate,
        duration: a.episodeLength,
        episodes: a.episodeCount,
        score: a.averageRating ? Number(a.averageRating) : null,
        synopsis: a.synopsis ?? a.description,
      };

      return { data: data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        status: 500,
      };
    }
  }

  /**
   * Retrieves the episode list for an anime.
   *
   * Also pads the returned list with placeholder entries when Kitsu
   * reports fewer episodes than the anime's total episode count.
   *
   * @param id - Numeric Kitsu anime ID.
   * @returns A response containing an array of episode objects.
   */
  async fetchEpisodes(id: number): Promise<IResponse<IKitsuEpisode[] | []>> {
    try {
      const [info, response] = await Promise.all([
        this.fetchInfo(id),
        this.client.fetch(`${this.baseUrl}/anime/${id}/episodes`, {
          method: 'GET',
        }),
      ]);

      if (!response.ok) {
        return {
          error: response.statusText,
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();

      const data = result.data.map((item: any) => {
        const a = item.attributes;

        return {
          episodeId: Number(id),

          thumbnail: a.thumbnail?.original ?? null,

          title: {
            romaji: a.titles?.en_jp ?? null,
            english: a.titles?.en ?? a.canonicalTitle ?? null,
            native: a.titles?.ja_jp ?? null,
          },

          airDate: a.airdate ?? null,

          seasonNumber: a.seasonNumber ?? 1,

          episodeNumber: a.number,

          relativeNumber: a.relativeNumber ?? a.number,

          synopsis: a.synopsis ?? a.description ?? null,
        };
      });

      const expectedEpisodes = info.data?.episodes ?? data.length;

      const lastSeason = data.at(-1)?.seasonNumber ?? 1;

      for (let episode = data.length + 1; episode <= expectedEpisodes; episode++) {
        data.push({
          episodeId: Number(id),

          thumbnail: null,

          title: {
            romaji: null,
            english: `Episode ${episode}`,
            native: null,
          },

          airDate: null,

          seasonNumber: lastSeason,

          episodeNumber: episode,

          relativeNumber: episode,

          synopsis: null,
        });
      }

      return {
        data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
        status: 500,
      };
    }
  }

  /**
   * Resolves an AniList anime ID to its corresponding Kitsu entry.
   *
   * Queries Kitsu's mappings endpoint with `externalSite=anilist/anime`.
   *
   * @param id - anime ID.
   * @param externalSite - database to use eg (anilist/myanimelist). Defaults to anilist
   * @returns A response containing a lightweight mapping object
   */
  async fetchMapping(id: number,externalSite:string="anilist"):Promise<IResponse<IProviderId|null>> {
    try {
      const response = await this.client.fetch(
        `${this.baseUrl}/mappings?filter[externalSite]=${externalSite}/anime&filter[externalId]=${id}&include=item`,
        { method: 'GET' },
      );
      if (!response.ok) {
        return {
          error: response.statusText,
          data: null,
          status: response.status,
        };
      }
      const result = await response.json();

      const kitsuId = result.data?.[0]?.relationships?.item?.data?.id;

      const anime = result.included?.find((item: any) => item.type === 'anime' && item.id === kitsuId);

      return {
        data: {
          id: kitsuId,
          provider: 'Kitsu',
          name: anime?.attributes?.canonicalTitle,
          romaji: anime?.attributes?.titles?.en_jp ?? anime?.attributes?.canonicalTitle,
          score: null,
          source:null,
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Err',
        data: null,
        status: 500,
      };
    }
  }

  /**
   * Fetches anime titles related to a specific Kitsu anime ID — sequels,
   * prequels, spin-offs, adaptations.
   *
   *
   *
   * @param mediaId - The unique Kitsu anime ID (required).
   * @returns A response containing an array of {@link IRelatedKitsuData}
   *          entries sorted by timeline order.
   */
  async fetchRelatedAnime(mediaId: string): Promise<IResponse<IRelatedKitsuData[] | []>> {
    if (!mediaId) {
      return {
        data: [],
        error: 'Missing a required parameter: mediaId',
        status: 400,
      };
    }

    try {
      const response = await this.client.fetch(
        `${this.baseUrl}/anime/${mediaId}/media-relationships?include=destination&page[limit]=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'application/vnd.api+json',
          },
        },
      );

      if (!response.ok) {
        return {
          error: response.statusText || 'Server returned an empty response',
          data: [],
          status: response.status,
        };
      }

      const result = await response.json();

      const relationships = result.data ?? [];
      const included = result.included ?? [];

      const findIncluded = (type: string, id: string) => included.find((inc: any) => inc.type === type && inc.id === id);

      const res: IRelatedKitsuData[] = relationships
        .filter(
          (rel: any) =>
            rel.relationships?.destination?.data?.type === 'anime' && this.TIMELINE_ROLES.has(rel.attributes?.role),
        )
        .map((rel: any) => {
          const dest = rel.relationships.destination.data;
          const node = findIncluded(dest.type, dest.id);

          return node ? this.mapKitsuNode(node, rel.attributes.role) : null;
        })
        .filter((entry: any): entry is IRelatedKitsuData => entry !== null);

      return {
        data: this.sortByTimeline(res),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
        status: 500,
      };
    }
  }

  /**
   * Climbs the relation chain using only the `prequel` role, starting from
   * `mediaId`, until it finds a node with no further prequel
   *
   *
   * @param mediaId - Kitsu anime ID to start climbing from.
   * @returns A response containing the chronologically sorted franchise
   *          timeline, with the earliest entry marked `relationType: 'ROOT'`.
   */
  async fetchParentSeries(mediaId:string): Promise<IResponse<IRelatedKitsuData[] | []>> {
    let currentId = mediaId;
    let currentNode: any = null;
    const visitedIds = new Set<string>();

    let rootNode: any = null;
    let rootEdges: { relationType: string; node: any }[] = [];

    try {
      while (currentId && !visitedIds.has(currentId)) {
        visitedIds.add(currentId);

        const response = await this.client.fetch(
          `${this.baseUrl}/anime/${currentId}/media-relationships?include=destination&page[limit]=20`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'application/vnd.api+json',
            },
          },
        );

        if (!response.ok) {
          return {
            error: response.statusText || 'Server returned an empty response',
            data: [],
            status: response.status,
          };
        }

        const result = await response.json();

        const relationships = result.data ?? [];
        const included = result.included ?? [];

        if (!currentNode) {
          const nodeResponse = await this.client.fetch(`${this.baseUrl}/anime/${currentId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'application/vnd.api+json',
            },
          });

          if (!nodeResponse.ok) {
            return {
              error: nodeResponse.statusText || 'Server returned an empty response',
              data: [],
              status: nodeResponse.status,
            };
          }

          const nodeResult = await nodeResponse.json();
          currentNode = nodeResult.data;
        }

        rootNode = currentNode;

        const findIncluded = (type: string, id: string) => included.find((inc: any) => inc.type === type && inc.id === id);

        rootEdges = relationships
          .filter(
            (rel: any) =>
              this.TIMELINE_ROLES.has(rel.attributes?.role) && rel.relationships?.destination?.data?.type === 'anime',
          )
          .map((rel: any) => {
            const dest = rel.relationships.destination.data;
            const node = findIncluded(dest.type, dest.id);

            return node
              ? {
                  relationType: rel.attributes.role,
                  node,
                }
              : null;
          })
          .filter(
            (
              edge: any,
            ): edge is {
              relationType: string;
              node: any;
            } => edge !== null,
          );

        const prequelEdge = rootEdges.find(edge => edge.relationType === 'prequel');

        if (!prequelEdge) {
          break;
        }

        currentId = prequelEdge.node.id;
        currentNode = prequelEdge.node;
      }

      if (!rootNode) {
        return {
          error: 'Could not resolve a root series',
          data: [],
          status: 404,
        };
      }

      const timeline = this.sortByTimeline([
        this.mapKitsuNode(rootNode, ''),
        ...rootEdges.map(edge => this.mapKitsuNode(edge.node, edge.relationType)),
      ]);

      if (timeline.length > 0) {
        timeline[0] = {
          ...timeline[0],
          relationType: 'ROOT',
        };
      }

      return {
        data: timeline,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown Error',
        data: [],
        status: 500,
      };
    }
  }

  /** Roles considered part of a franchise timeline. */
  private readonly TIMELINE_ROLES = new Set(['prequel', 'sequel']);

  /**
   * Maps a raw Kitsu anime node (from `included` or a direct fetch)
   * into the standardised {@link IRelatedKitsuData} shape.
   *
   * @param node - Raw Kitsu resource object.
   * @param relationType - Relation role (`prequel`, `sequel`, `ROOT`, etc.).
   * @returns Normalised related-anime entry.
   */
  private mapKitsuNode(node: any, relationType: string): IRelatedKitsuData {
    const attrs = node.attributes ?? {};
    const titles = attrs.titles ?? {};

    return {
      kitsuId: node.id,
      relationType,
      title: {
        romaji: attrs.canonicalTitle ?? titles.en_jp ?? titles.ja_jp ?? null,
        english: titles.en ?? null,
        native: titles.ja_jp ?? null,
      },
      type: node.type,
      format: attrs.subtype,
      synonyms: attrs.abbreviatedTitles ?? null,
      year: attrs.startDate ? Number(attrs.startDate.slice(0, 4)) : null,
      startDate: attrs.startDate ?? null,
      endDate: attrs.endDate ?? null,
      score: attrs.averageRating ? Number(attrs.averageRating) : null,
      image: attrs.posterImage?.large ?? attrs.posterImage?.original ?? attrs.posterImage?.medium ?? null,
      bannerImage: attrs.coverImage?.large ?? attrs.coverImage?.original ?? null,
    };
  }

  /**
   * Sorts entries chronologically by startDate (ascending), falling back to
   * endDate when startDate is missing. Entries with no date at all are
   * pushed to the end, after everything with a known date.
   *
   * @param entries - Array of related-anime entries to sort.
   * @returns A new array sorted by timeline order.
   */
  private sortByTimeline(entries: IRelatedKitsuData[]): IRelatedKitsuData[] {
    return [...entries].sort((a, b) => {
      const aDate = a.startDate ?? a.endDate;
      const bDate = b.startDate ?? b.endDate;

      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;

      return aDate.localeCompare(bDate);
    });
  }
}

export { Kitsu };
