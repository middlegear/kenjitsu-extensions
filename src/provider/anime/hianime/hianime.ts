import * as cheerio from 'cheerio';
import { HiAnimeServers, type Anime, type EpisodeInfo, type AnimeInfo, type ServerInfo } from './types.js';
import { extractSearchResults, extractAnimeInfo, extractEpisodesList, extractServerData } from './scraper.js';
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
      error: 'Missing required Params : query',
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
        error: 'Cheerio Error: No results found',
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
export async function fetchAnimeInfo(animeId: string): Promise<ZoroAnimeInfo> {
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
        error: 'Scraper error',
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
        error: 'Scraper Error: No results found',
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
  if (!episodeId)
    return {
      data: null,
      error: 'Missing required params: episodeId!',
    };

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
    if (!servers) {
      throw new Error('Couldnt find servers');
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
  if (!episodeId) {
    throw new Error('Missing required vaild params episodeId');
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
      if (!servers || !servers[category]) {
        throw new Error('Invalid servers or category data.');
      }

      const serverIndex = servers[category].findIndex(s => (s.serverName || '').toLowerCase() === server.toLowerCase());

      return serverIndex !== -1 ? servers[category][serverIndex].mediaId : null;
    };

    const fetchedServers = (await fetchServers(episodeId)).data as ServerInfo;
    const serverId = findServerId(fetchedServers, category, server);
    if (!serverId) {
      throw new Error('Couldnt find source');
    }
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
