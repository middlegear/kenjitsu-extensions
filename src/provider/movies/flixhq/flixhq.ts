import * as cheerio from 'cheerio';

import { scrapeMediaInfo, scrapeSearch } from './scraper.js';

import { type FLixepisodes, type MediaInfo, type searchTypes, type ServerRes, StreamingServers } from './types.js';
import VidCloud, { type sources, type subtitles, type ExtractedData } from '../../../source-extractors/vidcloud.js';
import { FetchClient } from '../../../config/client.js';

export const flixhqBaseUrl = 'https://flixhq.to' as const;

const client = new FetchClient();
interface FlixSucessSearchRes {
  data: searchTypes[];
  hasNextPage: boolean;
  currentPage: number;
}
interface FlixErrorSearchRes {
  data: [];
  error: string;
  hasNextPage: boolean;
  currentPage: number;
}
export type FlixSearchRes = FlixSucessSearchRes | FlixErrorSearchRes;
export async function _search(query: string, page: number): Promise<FlixSearchRes> {
  if (!query) {
    return { data: [], error: 'Missing required params: query!', currentPage: 0, hasNextPage: false };
  }
  const searchString = query.replace(/[\W_]+/g, '-');
  try {
    const response = await client.get(`${flixhqBaseUrl}/search/${searchString}`, { params: { page: String(page) } });
    if (!response.data) {
      return {
        hasNextPage: false,
        currentPage: 0,
        error: response.statusText || 'Received empty response from server',
        data: [],
      };
    }
    const data$ = cheerio.load(response.data);
    const res = scrapeSearch(data$);
    if (!Array.isArray(res.results) || res.results.length === 0) {
      return {
        hasNextPage: false,
        currentPage: 0,
        error: 'Cheerio Error: No search results found',
        data: [],
      };
    }
    return { currentPage: page, hasNextPage: res.hasNextPage, data: res.results };
  } catch (error) {
    return { data: [], currentPage: 0, hasNextPage: false, error: error instanceof Error ? error.message : 'Unknown err' };
  }
}

interface SuccessFlixInfo {
  data: MediaInfo;
  episodes: FLixepisodes;
}
interface ErrorFlixInfo {
  data: null;
  episodes: [];
  error: string;
}
export type FLixInfoRes = SuccessFlixInfo | ErrorFlixInfo;
export async function _getInfo(mediaId: string): Promise<FLixInfoRes> {
  if (!mediaId) {
    return {
      data: null,
      episodes: [],
      error: 'Missing required parameter mediaId!',
    };
  }

  const finalMediaId = `${flixhqBaseUrl}/${mediaId.replace('-', '/')}`;

  try {
    const response = await client.get(finalMediaId);
    if (!response.data) {
      return {
        data: null,
        episodes: [],
        error: response.statusText || 'Received empty response from server',
      };
    }

    const $ = cheerio.load(response.data);
    const mediaInfo = scrapeMediaInfo($);
    const uid = $('.watch_block').attr('data-id')!;

    // URL Builder
    function buildAjaxUrl(id: string, kind: 'movie' | 'tv' | 'season') {
      switch (kind) {
        case 'movie':
          return `${flixhqBaseUrl}/ajax/movie/episodes/${id}`;
        case 'tv': // initial request for TV seasons
          return `${flixhqBaseUrl}/ajax/v2/tv/seasons/${id}`;
        case 'season': // fetch episodes for a season
          return `${flixhqBaseUrl}/ajax/v2/season/episodes/${id}`;
      }
    }

    //Fetch Seasons
    async function fetchSeasons(tvId: string): Promise<{ id: string; seasonNum: number }[]> {
      const { data } = await client.get(buildAjaxUrl(tvId, 'tv'));
      if (!data) return [];

      const $$ = cheerio.load(data);
      return $$('.dropdown-menu > a')
        .map((_, el) => {
          const id = $$(el).attr('data-id')!;
          const label = $$(el).text().trim(); // e.g., "Season 2"
          const seasonNum = parseInt(label.replace(/\D/g, ''), 10) || 1;
          return { id, seasonNum };
        })
        .get();
    }

    //Fetch Episodes
    async function fetchEpisodes(seasonId: string, seasonNum: number) {
      const { data } = await client.get(buildAjaxUrl(seasonId, 'season'));
      if (!data) return [];

      const $$ = cheerio.load(data);
      return $$('.nav > li')
        .map((_, el) => {
          const anchor = $$(el).find('a');
          const rawId = anchor.attr('id')!; // e.g. "ep-12345"
          const title = anchor.attr('title')!;
          return {
            episodeId: `episode-${rawId.split('-')[1]}`,
            title,
            number: parseInt(title.split(':')[0].slice(3).trim(), 10),
            season: seasonNum,
          };
        })
        .get();
    }

    // Handle TV vs Movie
    let episodes: FLixepisodes = [];

    if (mediaInfo.type === 'TV') {
      const seasons = await fetchSeasons(uid);

      for (const { id, seasonNum } of seasons) {
        const seasonEpisodes = await fetchEpisodes(id, seasonNum);
        episodes.push(...seasonEpisodes);
      }
    } else {
      episodes = [
        {
          episodeId: `movie-${uid}`,
          title: mediaInfo.title,
        },
      ];
    }

    return { data: mediaInfo, episodes };
  } catch (err) {
    return {
      data: null,
      episodes: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

interface SuccessFlixServerRes {
  data: ServerRes[];
}
interface ErrorFlixSeverRes {
  data: [];
  error: string;
}
export type FlixServerRes = SuccessFlixServerRes | ErrorFlixSeverRes;
export async function _getServers(episodeId: string): Promise<FlixServerRes> {
  if (!episodeId) {
    return { data: [], error: 'Missing required params episodeId!' };
  }

  const isMovie = episodeId.startsWith('movie-');
  const id = episodeId.split('-').at(1);

  const url = isMovie ? `${flixhqBaseUrl}/ajax/movie/episodes/${id}` : `${flixhqBaseUrl}/ajax/v2/episode/servers/${id}`;

  try {
    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    const servers = $('.nav > li')
      .map((_, el) => {
        const anchor = $(el).find('a');
        const title = anchor.attr('title') || '';

        return {
          name: isMovie
            ? title.toLowerCase().trim()
            : title
                .replace(/^Server\s*/i, '')
                .toLowerCase()
                .trim(), // instead of slice(6)
          id: Number(anchor.attr('data-id') || anchor.attr('data-linkid')),
        };
      })
      .get();

    return { data: servers as ServerRes[] };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

interface SuccessFlixSourceRes {
  data: {
    subtitles: subtitles[];
    sources: sources[];
  };
  headers: { Referer: string };
}
interface ErrorFlixSourcesRes {
  data: null;
  headers: { Referer: null };
  error: string;
}

export type FLixSourcesRes = SuccessFlixSourceRes | ErrorFlixSourcesRes;
export async function _getsources(episodeId: string, server: StreamingServers): Promise<FLixSourcesRes> {
  if (episodeId.includes('embed')) {
    const serverUrl = new URL(episodeId);

    switch (server) {
      case StreamingServers.VidCloud:
      case StreamingServers.Upcloud:
      case StreamingServers.Akcloud:
        return {
          headers: { Referer: `${serverUrl.origin}/` },
          data: (await new VidCloud().extract(serverUrl)) as ExtractedData,
        };
      default:
        return {
          headers: { Referer: `${serverUrl.origin}/` },
          data: (await new VidCloud().extract(serverUrl)) as ExtractedData,
        };
    }
  }
  try {
    const servers = await _getServers(episodeId);

    if ('error' in servers) {
      throw new Error(servers.error);
    }

    if (Array.isArray(servers.data) && servers.data.length > 0) {
      const index = servers.data.findIndex(s => s.name === server);
      if (index === -1) {
        throw new Error(`Server ${server} not found`);
      }
      const serverId = servers.data[index].id;
      const { data } = await client.get(`${flixhqBaseUrl}/ajax/episode/sources/${serverId}`);

      const serverUrl: URL = new URL(data.link);
      return await _getsources(serverUrl.href, server);
    } else {
      throw new Error(`Server ${server} not found or data invalid`);
    }
  } catch (error) {
    return { data: null, headers: { Referer: null }, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
