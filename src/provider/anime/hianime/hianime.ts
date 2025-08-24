import * as cheerio from 'cheerio';
import {
  HiAnimeServers,
  type Anime,
  type EpisodeInfo,
  type AnimeInfo,
  type ServerInfo,
  type HomePage,
  type Airing,
  type TopAnime,
} from './types.js';
import {
  extractSearchResults,
  extractAnimeInfo,
  extractEpisodesList,
  extractServerData,
  extractHomePage,
  extractTopAiring,
  extractAtoZlist,
} from './scraper.js';
import MegaCloud from '../../../source-extractors/megacloud.js';
import { type ASource, SubOrDub } from '../../../types/types.js';
import { FetchClient } from '../../../config/client.js';

export const zoroBaseUrl = 'https://hianime.to' as const;

const client = new FetchClient();

export interface SuccessSearchResponse {
  data: Anime[];
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
}
export interface SearchErrorResponse {
  data: [];
  hasNextPage: boolean;
  error: string;
  lastPage: number;
  currentPage: number;
}
export type SearchResponse = SuccessSearchResponse | SearchErrorResponse;
export async function searchAnime(query: string, page: number): Promise<SearchResponse> {
  if (!query) {
    return {
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      data: [],
      error: 'Missing required Params : a query string',
    };
  }

  query = query.trim();

  try {
    const response = await client.get(`${zoroBaseUrl}/search`, {
      params: {
        keyword: query,
        page: page.toString(),
      },
    });

    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: [],
      };
    }

    const html = response.data;
    const $data = cheerio.load(html);
    const searchSelector: cheerio.SelectorType = '.block_area-content .film_list-wrap .flw-item';
    const { anime, hasNextPage, totalPages, currentPage } = extractSearchResults($data, searchSelector);

    if (!Array.isArray(anime) || anime.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No search results found',
        data: [],
      };
    }

    return {
      hasNextPage: hasNextPage,
      currentPage: Number(currentPage) || 0,
      lastPage: Number(totalPages) || 0,
      data: anime,
    };
  } catch (error) {
    return {
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
      data: [],
    };
  }
}
export interface AnimeInfoSuccess {
  data: AnimeInfo;
}
export interface AnimeInfoError {
  data: null;
  error: string;
}
export type ZoroAnimeInfo = AnimeInfoSuccess | AnimeInfoError;
export async function fetchAnimeInfo(animeId: string) {
  if (!animeId.trim())
    return {
      data: null,
      error: 'Missing required params :animeId',
    };

  try {
    const response = await client.get(`${zoroBaseUrl}/${animeId}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${zoroBaseUrl}/watch/${animeId}`,
      },
    });

    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        data: null,
      };

    const $animeData = cheerio.load(response.data);
    const { res } = extractAnimeInfo($animeData);
    if (!res) {
      return {
        error: 'Scraper error: No AnimeInfo found',
        data: null,
      };
    }

    return { data: res };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Fatal error',
    };
  }
}

export interface EpisodeSuccessInfoResponse {
  data: EpisodeInfo[];
}
export interface EpisodeErrorInfoResponse {
  data: [];
  error: string;
}
export type EpisodeInfoRes = EpisodeSuccessInfoResponse | EpisodeErrorInfoResponse;
export async function getEpisodes(animeId: string): Promise<EpisodeInfoRes> {
  if (!animeId)
    return {
      data: [],
      error: 'Missing required params :animeId',
    };
  try {
    const response = await client.get(`${zoroBaseUrl}/ajax/v2/episode/list/${animeId.split('-').pop()}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${zoroBaseUrl}/watch/${animeId}`,
      },
    });

    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        data: [],
      };

    const $episodes = cheerio.load(response.data.html);
    const episodesSelector: cheerio.SelectorType = '.detail-infor-content .ss-list a';
    const { resEpisodeList } = extractEpisodesList($episodes, episodesSelector);
    if (!Array.isArray(resEpisodeList) || resEpisodeList.length === 0) {
      return {
        error: 'Scraper Error: No episodes found',
        data: [],
      };
    }

    return { data: resEpisodeList };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Contact dev if you see this',
    };
  }
}
export interface SuccessServerInfo {
  data: ServerInfo;
}
export interface ErrorServerInfo {
  data: null;
  error: string;
}
export type ServerInfoResponse = SuccessServerInfo | ErrorServerInfo;
export async function fetchServers(episodeId: string): Promise<ServerInfoResponse> {
  if (!episodeId || episodeId.includes('?ep=')) {
    if (episodeId.includes('?ep=')) {
      return {
        data: null,
        error: "Invalid format! Please use the '-episode-' format instead of ?ep=.",
      };
    }
    return {
      data: null,
      error: 'Missing required params: valid episodeId!',
    };
  }
  try {
    const newId = episodeId.split('-').pop()?.trim() as string;

    const response = await client.get(`${zoroBaseUrl}/ajax/v2/episode/servers`, {
      params: {
        episodeId: newId,
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${zoroBaseUrl}/watch/?ep=${newId}`,
      },
    });
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        data: null,
      };

    const res$: cheerio.CheerioAPI = cheerio.load(response.data.html);

    const { servers } = extractServerData(res$);

    if (servers.sub.length === 0 && servers.dub.length === 0 && servers.raw.length === 0) {
      throw new Error('No server data received. Use a different category');
    }
    return {
      data: servers,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Internal Server Error',
      data: null,
    };
  }
}

export interface SuccessSourceRes {
  data: ASource;
  headers: {
    Referer: string;
  };
}
export interface ErrorSourceRes {
  data: null;
  headers: {
    Referer: null;
  };

  error: string;
}
export type HianimeSourceResponse = SuccessSourceRes | ErrorSourceRes;
export async function fetchEpisodeSources(
  episodeId: string,
  server: HiAnimeServers,
  category: SubOrDub,
): Promise<HianimeSourceResponse> {
  if (!episodeId || episodeId.includes('ep=')) {
    if (episodeId.includes('ep=')) {
      throw new Error("Invalid format! Please use the ' - episode - ' format instead of ?ep=.");
    }
    throw new Error('Missing required params: valid episodeId!');
  }

  if (episodeId.startsWith('http')) {
    const serverUrl = new URL(episodeId);
    switch (server) {
      case HiAnimeServers.HD1:
      case HiAnimeServers.HD2:
      case HiAnimeServers.HD3:
        return {
          headers: { Referer: `${serverUrl.origin}/` },
          data: (await new MegaCloud().extract(serverUrl)) as ASource,
        };

      default:
        return {
          headers: { Referer: `${serverUrl.origin}/` },
          data: (await new MegaCloud().extract(serverUrl)) as ASource,
        };
    }
  }
  try {
    // console.log(link, mediadataId);
    // const id = link.split('/').at(-1);
    // console.log(id);
    // const sources = puppeteer(id);

    const findServerId = (servers: ServerInfo, category: SubOrDub, server: HiAnimeServers) => {
      const availableCategories: string[] = [];
      if (servers.sub?.length > 0) availableCategories.push('sub');
      if (servers.dub?.length > 0) availableCategories.push('dub');
      if (servers.raw?.length > 0) availableCategories.push('raw');

      if (!servers[category] || servers[category].length === 0) {
        const suggestionMessage =
          availableCategories.length > 0
            ? ` Available categories: ${availableCategories.join(' or ')}.`
            : ' No servers available in any category right now.';

        throw new Error(`Category '${category}' has no servers.${suggestionMessage}`);
      }

      const availableServers = servers[category].map(s => s.serverName || 'unknown');
      const serverIndex = servers[category].findIndex(s => (s.serverName || '').toLowerCase() === server.toLowerCase());

      if (serverIndex === -1) {
        throw new Error(
          `Server '${server}' not found in category '${category}'. ` +
            `Try one of the available servers: ${availableServers.join(', ')}.`,
        );
      }

      return servers[category][serverIndex].mediaId;
    };

    const fetchedServers = (await fetchServers(episodeId)).data as ServerInfo;

    if ('error' in fetchedServers) {
      throw new Error(fetchedServers.error as string);
    }
    const serverId = findServerId(fetchedServers, category, server);

    const newId = episodeId.split('-').pop() as string;

    const response = await client.get(`${zoroBaseUrl}/ajax/v2/episode/sources`, {
      params: {
        id: String(serverId),
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${zoroBaseUrl}/watch/?ep=${newId}`,
      },
    });
    if (!response.data) throw new Error(response.statusText);

    return await fetchEpisodeSources(response.data.link, server, category);
  } catch (error) {
    return {
      data: null,
      headers: {
        Referer: null,
      },
      error: error instanceof Error ? error.message : 'Fatal Error',
    };
  }
}
export interface SuccessHomeRes {
  data: HomePage;
}
export interface ErrorHomeRes {
  data: null;
  error: string;
}
export type HomeRes = SuccessHomeRes | ErrorHomeRes;
export async function _fetchHomePage(): Promise<HomeRes> {
  try {
    const response = await client.get(`${zoroBaseUrl}/home`, {
      headers: {
        Referer: zoroBaseUrl,
      },
    });
    if (!response.data) {
      return {
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }
    const data$: cheerio.CheerioAPI = cheerio.load(response.data);
    const homepage = extractHomePage(data$);

    return { data: homepage };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown Error' };
  }
}
export interface SuccessRepetiveRes {
  data: Airing[];
  topAnime?: { daily: TopAnime[]; weekly: TopAnime[]; monthly: TopAnime[] };
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
}
export interface ErrorRepetiveRes {
  data: null;
  error: string;
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
}
export type HianimeRepetitiveSections = SuccessRepetiveRes | ErrorRepetiveRes;
export async function _fetchTopAiring(page: number): Promise<HianimeRepetitiveSections> {
  try {
    const response = await client.get(`${zoroBaseUrl}/top-airing`, {
      params: {
        page: String(page) || '1',
      },
    });
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }

    const data$ = cheerio.load(response.data);
    const res = extractTopAiring(data$);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No  results found',
        data: null,
      };
    }
    return {
      hasNextPage: res.hasNextPage,
      currentPage: res.currentPage as number,
      lastPage: res.totalPages as number,
      data: res.data,
      topAnime: res.topAnime,
    };
  } catch (error) {
    return {
      data: null,
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
    };
  }
}
export async function _fetchMostPopular(page: number): Promise<HianimeRepetitiveSections> {
  try {
    const response = await client.get(`${zoroBaseUrl}/most-popular`, {
      params: {
        page: String(page) || '1',
      },
    });
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }

    const data$ = cheerio.load(response.data);
    const res = extractTopAiring(data$);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No results found',
        data: null,
      };
    }
    return {
      hasNextPage: res.hasNextPage,
      currentPage: res.currentPage as number,
      lastPage: res.totalPages as number,
      data: res.data,
      topAnime: res.topAnime,
    };
  } catch (error) {
    return {
      data: null,
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
    };
  }
}
export async function _fetchFavourites(page: number): Promise<HianimeRepetitiveSections> {
  try {
    const response = await client.get(`${zoroBaseUrl}/most-favorite`, {
      params: {
        page: String(page) || '1',
      },
    });
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }

    const data$ = cheerio.load(response.data);
    const res = extractTopAiring(data$);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No  results found',
        data: null,
      };
    }
    return {
      hasNextPage: res.hasNextPage,
      currentPage: res.currentPage as number,
      lastPage: res.totalPages as number,
      data: res.data,
      topAnime: res.topAnime,
    };
  } catch (error) {
    return {
      data: null,
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
    };
  }
}
export async function _fetchRecentlyCompleted(page: number): Promise<HianimeRepetitiveSections> {
  try {
    const response = await client.get(`${zoroBaseUrl}/completed`, {
      params: {
        page: String(page) || '1',
      },
    });
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }

    const data$ = cheerio.load(response.data);
    const res = extractTopAiring(data$);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No  results found',
        data: null,
      };
    }
    return {
      hasNextPage: res.hasNextPage,
      currentPage: res.currentPage as number,
      lastPage: res.totalPages as number,
      data: res.data,
      topAnime: res.topAnime,
    };
  } catch (error) {
    return {
      data: null,
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
    };
  }
}

export async function _fetchRecentlyAdded(page: number): Promise<HianimeRepetitiveSections> {
  try {
    const response = await client.get(`${zoroBaseUrl}/recently-added`, {
      params: {
        page: String(page) || '1',
      },
    });
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }

    const data$ = cheerio.load(response.data);
    const res = extractTopAiring(data$);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No  results found',
        data: null,
      };
    }
    return {
      hasNextPage: res.hasNextPage,
      currentPage: res.currentPage as number,
      lastPage: res.totalPages as number,
      data: res.data,
      topAnime: res.topAnime,
    };
  } catch (error) {
    return {
      data: null,
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
    };
  }
}
export async function _fetchRecentlyUpdated(page: number): Promise<HianimeRepetitiveSections> {
  try {
    const response = await client.get(`${zoroBaseUrl}/recently-updated`, {
      params: {
        page: String(page) || '1',
      },
    });
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }

    const data$ = cheerio.load(response.data);
    const res = extractTopAiring(data$);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No  results found',
        data: null,
      };
    }
    return {
      hasNextPage: res.hasNextPage,
      currentPage: res.currentPage as number,
      lastPage: res.totalPages as number,
      data: res.data,
      topAnime: res.topAnime,
    };
  } catch (error) {
    return {
      data: null,
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
    };
  }
}

export async function _fetchAtoZList(sort?: any): Promise<HianimeRepetitiveSections> {
  //
  const sortValue = String(sort ?? '').trim();

  const sortCategory = !sortValue
    ? undefined
    : !Number.isNaN(Number(sortValue))
      ? '0-9'
      : sortValue.length === 1
        ? sortValue.toUpperCase()
        : 'other';

  const url = sortCategory ? `${zoroBaseUrl}/az-list/${sortCategory}` : `${zoroBaseUrl}/az-list`;

  try {
    const response = await client.get(url);
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: null,
      };
    }

    const data$ = cheerio.load(response.data);
    const res = extractAtoZlist(data$);

    if (!Array.isArray(res.data) || res.data.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
        error: 'Cheerio Error: No results found',
        data: null,
      };
    }
    return {
      hasNextPage: res.hasNextPage,
      currentPage: res.currentPage as number,
      lastPage: res.totalPages as number,
      data: res.data,
    };
  } catch (error) {
    return {
      data: null,
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
      error: error instanceof Error ? error.message : 'Unknown Error',
    };
  }
}
