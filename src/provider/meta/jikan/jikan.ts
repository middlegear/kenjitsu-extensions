import { AnimeProvider, Format, Seasons, JikanStatus } from '../../../types/types.js';
import { bestTitleMatch } from '../../../utils/mapper.js';
import { getMalMapping } from '../anizip/index.js';
import { HiAnime } from '../../anime/hianime/index.js';
import { AnimeKai } from '../../anime/animekai/index.js';
import { normalizeLowerCaseSeason, normalizeLowerCaseFormat, createSlug } from '../../../utils/normalize.js';
import { FetchClient } from '../../../config/client.js';

const jikanBaseUrl = 'https://api.jikan.moe/v4' as const;

const client = new FetchClient();
client.setProfile('normal-fetch');

export type JIkanData = {
  malId: number;
  image: string;
  bannerImage: string;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  trailer: string;
  format: string;
  status: string;
  duration: number;
  score: number;
  genres: string;
  episodes: number;
  synopsis: string;
  season: string;
  startDate: string;
  endDate: string;
  studio: string;
  producers: string[];
};
export type Pagination = {
  hasNextPage: boolean;
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
};
export interface SuccessJIkanRes {
  data: JIkanData[];
  hasNextPage: boolean;
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
}
export interface ErrorJIkanRes {
  data: [];
  hasNextPage: boolean;
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  error: string;
}
export type JIkanSearch = SuccessJIkanRes | ErrorJIkanRes;
export async function searchAnime(query: string, page: number, limit: number): Promise<JIkanSearch> {
  if (!query) {
    return {
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
      error: 'Missing required fields : search',
    };
  }
  try {
    const response = await client.get(`${jikanBaseUrl}/anime`, {
      params: {
        q: query,
        page: String(page),
        limit: String(limit),
      },
    });
    if (!response.data)
      return {
        error: 'Server returned an empty response',
        hasNextPage: false,
        total: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    const pagination: Pagination = {
      hasNextPage: response.data.pagination.has_next_page,
      lastPage: response.data.pagination.last_visible_page,
      currentPage: page,
      total: response.data.pagination.items.total,
      perPage: response.data.pagination.items.per_page,
    };
    const search: JIkanData[] = response.data.data.map((item: any) => ({
      malId: item.mal_id,
      title: {
        romaji: item.title,
        english: item.title_english,
        native: item.title_japanese,
      },
      image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      trailer: item.trailer.embed_url ?? item.trailer.url,
      episodes: item.episodes,
      startDate:
        item.aired.prop && item.aired.prop.from.year
          ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )
          : item.aired.from || 'Unknown',

      endDate:
        item.aired.prop && item.aired.prop.to.year
          ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : item.aired.to || 'Unknown',
      format: item.type,
      status: item.status,
      genres: item.genres.map((item2: any) => item2.name),
      duration: item.duration,
      score: item.score,
      synopsis: item.synopsis,
      season: item.season,
      studio: item.studios,
      producers: item.producers,
    }));

    return {
      hasNextPage: pagination.hasNextPage,
      total: pagination.total,
      lastPage: pagination.lastPage,
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      data: search as JIkanData[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
}
export interface SuccessJIkanInfo {
  data: JIkanData;
}
export interface ErrorJikanInfo {
  data: null;
  error: string;
}
export type JikanInfo = SuccessJIkanInfo | ErrorJikanInfo;
export async function getInfoById(Id: number): Promise<JikanInfo> {
  if (!Id) {
    return {
      error: 'Missing required parameter : MALId!',
      data: null,
    };
  }
  try {
    const response = await client.get(`${jikanBaseUrl}/anime/${Id}`);
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        data: null,
      };
    const animeInfo: JIkanData = {
      malId: response.data.data.mal_id,
      title: {
        romaji: response.data.data.title,
        english: response.data.data.title_english,
        native: response.data.data.title_japanese,
      },
      image: response.data.data.images.jpg.large_image_url ?? response.data.data.images.webp.large_image_url,
      bannerImage: response.data.data.images.jpg.large_image_url ?? response.data.data.images.webp.large_image_url,
      trailer: response.data.data.trailer.embed_url ?? response.data.data.trailer.url,
      episodes: response.data.data.episodes,

      startDate:
        response.data.data.aired.prop && response.data.data.aired.prop.from.year
          ? new Date(
              response.data.data.aired.prop.from.year,
              response.data.data.aired.prop.from.month - 1,
              response.data.data.aired.prop.from.day,
            ).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : response.data.data.aired.from || 'Unknown',

      endDate:
        response.data.data.aired.prop && response.data.data.aired.prop.to.year
          ? new Date(
              response.data.data.aired.prop.to.year,
              response.data.data.aired.prop.to.month - 1,
              response.data.data.aired.prop.to.day,
            ).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : response.data.data.aired.to || 'Unknown',
      format: response.data.data.type,
      status: response.data.data.status,
      genres: response.data.data.genres.map((item2: any) => item2.name),
      duration: response.data.data.duration,
      score: response.data.data.score,
      synopsis: response.data.data.synopsis,
      season: response.data.data.season,
      studio: response.data.data.studios,
      producers: response.data.data.producers,
    };
    return {
      data: animeInfo as JIkanData,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      data: null,
    };
  }
}
type Char = {
  role: string;
  id: number;
  name: string;
  image: string;
  voiceActors: voiceActors[];
};
type voiceActors = {
  name: string;
  image: string;
  language: string;
};
export interface SuccessCharJikanRes {
  data: Char[];
}
export interface ErrorCharJikanRes {
  data: [];
  error: string;
}
export type JikanCharacters = SuccessCharJikanRes | ErrorCharJikanRes;
export async function getAnimeCharacters(id: number): Promise<JikanCharacters> {
  if (!id) {
    return {
      error: 'Missing required parameter : MALId!',

      data: [],
    };
  }
  try {
    const response = await client.get(`${jikanBaseUrl}/anime/${id}/characters`);
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        data: [],
      };
    const res: Char[] = response.data.data.map((item: any) => ({
      role: item.role,
      id: item.character.mal_id,
      name: item.character.name,
      image:
        item.character.images.jpg.image_url ??
        item.character.images.webp.image_url ??
        item.character.images.webp.small_image_url,

      voiceActors: item.voice_actors.map((item2: any) => ({
        name: item2.person.name,
        image: item2.person.images.jpg.image_url,
        language: item2.language,
      })),
    }));
    return {
      data: res as Char[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      data: [],
    };
  }
}

export type JikanSeason = SuccessJIkanRes | ErrorJIkanRes;

export async function getCurrentSeason(page: number, limit: number, filter: Format): Promise<JikanSeason> {
  if (!filter) {
    return {
      error: 'Missing required parameter : filter!',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
  const newFormat = filter.toLowerCase();
  try {
    const response = await client.get(`${jikanBaseUrl}/seasons/now`, {
      params: {
        filter: newFormat,
        page: String(page),
        sfw: 'true',
        limit: String(limit),
      },
    });
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        hasNextPage: false,
        total: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };

    const res = response.data;
    const pagination: Pagination = {
      hasNextPage: res.pagination.has_next_page,
      lastPage: res.pagination.last_visible_page,
      currentPage: page,
      total: res.pagination.items.total,
      perPage: res.pagination.items.per_page,
    };
    const currentSeason: JIkanData[] = res.data.map((item: any) => ({
      malId: item.mal_id,
      title: {
        romaji: item.title,
        english: item.title_english,
        native: item.title_japanese,
      },
      image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      trailer: item.trailer.embed_url ?? item.trailer.url,
      episodes: item.episodes,
      startDate:
        item.aired.prop && item.aired.prop.from.year
          ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )
          : item.aired.from || 'Unknown',

      endDate:
        item.aired.prop && item.aired.prop.to.year
          ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : item.aired.to || 'Unknown',
      format: item.type,
      status: item.status,
      genres: item.genres.map((item2: any) => item2.name),
      duration: item.duration,
      score: item.score,
      synopsis: item.synopsis,
      season: item.season,
      studio: item.studios,
      producers: item.producers,
    }));

    return {
      hasNextPage: pagination.hasNextPage,
      total: pagination.total,
      lastPage: pagination.lastPage,
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      data: currentSeason as JIkanData[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
}

export async function getNextSeason(page: number, limit: number, filter: Format): Promise<JikanSeason> {
  if (!filter) {
    return {
      error: 'Missing required parameter :filter!',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
  const newFormat = filter.toLowerCase();
  try {
    const response = await client.get(`${jikanBaseUrl}/seasons/upcoming`, {
      params: {
        filter: newFormat,
        sfw: 'true',
        page: String(page),
        limit: String(limit),
      },
    });
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        hasNextPage: false,
        total: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    const res = response.data;
    const pagination: Pagination = {
      hasNextPage: res.pagination.has_next_page,
      lastPage: res.pagination.last_visible_page,
      currentPage: page,
      total: res.pagination.items.total,
      perPage: res.pagination.items.per_page,
    };

    const NextSeason: JIkanData[] = res.data.map((item: any) => ({
      malId: item.mal_id,
      title: {
        romaji: item.title,
        english: item.title_english,
        native: item.title_japanese,
      },
      image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      trailer: item.trailer.embed_url ?? item.trailer.url,
      episodes: item.episodes,
      startDate:
        item.aired.prop && item.aired.prop.from.year
          ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )
          : item.aired.from || 'Unknown',

      endDate:
        item.aired.prop && item.aired.prop.to.year
          ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : item.aired.to || 'Unknown',
      format: item.type,
      status: item.status,
      genres: item.genres.map((item2: any) => item2.name),
      duration: item.duration,
      score: item.score,
      synopsis: item.synopsis,
      season: item.season,
      studio: item.studios,
      producers: item.producers,
    }));

    return {
      hasNextPage: pagination.hasNextPage,
      total: pagination.total,
      lastPage: pagination.lastPage,
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      data: NextSeason as JIkanData[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
}

export async function getSeason(
  year: number,
  season: Seasons,
  filter: Format,
  page: number,
  limit: number,
): Promise<JikanSeason> {
  if (!year || !season) {
    return {
      error: 'Missing required parameter : year & season',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
  try {
    const newseason = normalizeLowerCaseSeason(season);
    const format = normalizeLowerCaseFormat(filter);
    const response = await client.get(`${jikanBaseUrl}/seasons/${year}/${newseason}`, {
      params: {
        filter: format,
        sfw: 'true',
        page: String(page),
        limit: String(limit),
      },
    });
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        hasNextPage: false,
        total: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };

    const res = response.data;
    const pagination: Pagination = {
      hasNextPage: res.pagination.has_next_page,
      lastPage: res.pagination.last_visible_page,
      currentPage: page,
      total: res.pagination.items.total,
      perPage: res.pagination.items.per_page,
    };

    const Season: JIkanData[] = res.data.map((item: any) => ({
      malId: item.mal_id,
      title: {
        romaji: item.title,
        english: item.title_english,
        native: item.title_japanese,
      },
      image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      trailer: item.trailer.embed_url ?? item.trailer.url,
      episodes: item.episodes,

      startDate:
        item.aired.prop && item.aired.prop.from.year
          ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )
          : item.aired.from || 'Unknown',

      endDate:
        item.aired.prop && item.aired.prop.to.year
          ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : item.aired.to || 'Unknown',
      format: item.type,
      status: item.status,
      genres: item.genres.map((item2: any) => item2.name),
      duration: item.duration,
      score: item.score,
      synopsis: item.synopsis,
      season: item.season,
      studio: item.studios,
      producers: item.producers,
    }));

    return {
      hasNextPage: pagination.hasNextPage,
      total: pagination.total,
      lastPage: pagination.lastPage,
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      data: Season as JIkanData[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
}
export type JikanTopAnime = SuccessJIkanRes | ErrorJIkanRes;
export async function getTopUpcoming(
  page: number,
  perPage: number,
  filter: JikanStatus = JikanStatus.Upcoming,
): Promise<JikanTopAnime> {
  try {
    const response = await client.get(`${jikanBaseUrl}/top/anime`, {
      params: {
        filter: filter,
        sfw: 'true',
        page: String(page),
        limit: String(perPage),
      },
    });
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        hasNextPage: false,
        total: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    const res = response.data;
    const pagination: Pagination = {
      hasNextPage: res.pagination.has_next_page,
      lastPage: res.pagination.last_visible_page,
      currentPage: page,
      total: res.pagination.items.total,
      perPage: res.pagination.items.per_page,
    };

    const topAnime: JIkanData[] = res.data.map((item: any) => ({
      malId: item.mal_id,
      title: {
        romaji: item.title,
        english: item.title_english,
        native: item.title_japanese,
      },
      image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      trailer: item.trailer.embed_url ?? item.trailer.url,
      episodes: item.episodes,

      startDate:
        item.aired.prop && item.aired.prop.from.year
          ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )
          : item.aired.from || 'Unknown',

      endDate:
        item.aired.prop && item.aired.prop.to.year
          ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : item.aired.to || 'Unknown',

      format: item.type,
      status: item.status,
      genres: item.genres.map((item2: any) => item2.name),
      duration: item.duration,
      score: item.score,
      synopsis: item.synopsis,
      season: item.season,
      studio: item.studios,
      producers: item.producers,
    }));

    return {
      hasNextPage: pagination.hasNextPage,
      total: pagination.total,
      lastPage: pagination.lastPage,
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      data: topAnime as JIkanData[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
}
export async function getTopAnime(page: number, limit: number, filter: JikanStatus, type: Format): Promise<JikanTopAnime> {
  try {
    const format = normalizeLowerCaseFormat(type);
    const response = await client.get(`${jikanBaseUrl}/top/anime`, {
      params: {
        filter: filter,
        type: format,
        sfw: 'true',
        page: String(page),
        limit: String(limit),
      },
    });
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        hasNextPage: false,
        total: 0,
        lastPage: 0,
        currentPage: 0,
        perPage: 0,
        data: [],
      };
    const res = response.data;
    const pagination: Pagination = {
      hasNextPage: res.pagination.has_next_page,
      lastPage: res.pagination.last_visible_page,
      currentPage: page,
      total: res.pagination.items.total,
      perPage: res.pagination.items.per_page,
    };

    const topAnime: JIkanData[] = res.data.map((item: any) => ({
      malId: item.mal_id,
      title: {
        romaji: item.title,
        english: item.title_english,
        native: item.title_japanese,
      },
      image: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      bannerImage: item.images.jpg.large_image_url ?? item.images.webp.large_image_url,
      trailer: item.trailer.embed_url ?? item.trailer.url,
      episodes: item.episodes,

      startDate:
        item.aired.prop && item.aired.prop.from.year
          ? new Date(item.aired.prop.from.year, item.aired.prop.from.month - 1, item.aired.prop.from.day).toLocaleString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )
          : item.aired.from || 'Unknown',

      endDate:
        item.aired.prop && item.aired.prop.to.year
          ? new Date(item.aired.prop.to.year, item.aired.prop.to.month - 1, item.aired.prop.to.day).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : item.aired.to || 'Unknown',
      format: item.type,
      status: item.status,
      genres: item.genres.map((item2: any) => item2.name),
      duration: item.duration,
      score: item.score,
      synopsis: item.synopsis,
      season: item.season,
      studio: item.studios,
      producers: item.producers,
    }));

    return {
      hasNextPage: pagination.hasNextPage,
      total: pagination.total,
      lastPage: pagination.lastPage,
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      data: topAnime as JIkanData[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      hasNextPage: false,
      total: 0,
      lastPage: 0,
      currentPage: 0,
      perPage: 0,
      data: [],
    };
  }
}
type episodePagination = {
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
};
type EpisodeRes = {
  number: number;
  title: string;
  filler: boolean;
  recap?: boolean;
  score?: number;
};
export interface SuccessJikanEpisodes {
  data: EpisodeRes[];
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
}
export interface ErrorJikanEpisodes {
  data: [];
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
  error: string;
}
export type JikanEpisodes = SuccessJikanEpisodes | ErrorJikanEpisodes;
export async function getEpisodes(id: number, page: number): Promise<JikanEpisodes> {
  if (!id) {
    return {
      error: 'Missing required parameter : Malid!',
      data: [],
      hasNextPage: false,
      currentPage: 0,
      lastPage: 0,
    };
  }

  try {
    const response = await client.get(`${jikanBaseUrl}/anime/${id}/episodes`, {
      params: {
        page: String(page),
      },
    });
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        data: [],
        hasNextPage: false,
        currentPage: 0,
        lastPage: 0,
      };
    const pagination: episodePagination = {
      hasNextPage: response.data.pagination.has_next_page,
      lastPage: response.data.pagination.last_visible_page,
      currentPage: page,
    };

    const data: EpisodeRes[] = response.data.data.map((item: any) => ({
      number: item.mal_id,
      title: item.title,
      filler: item.filler,
      recap: item.recap,
      score: item.score,
    }));
    return {
      hasNextPage: pagination.hasNextPage,
      currentPage: pagination.currentPage,
      lastPage: pagination.lastPage,
      data: data as EpisodeRes[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      hasNextPage: false,
      lastPage: 0,
      currentPage: 0,
      data: [],
    };
  }
}
export interface SuccessJikanEpisodesInfo {
  data: EpisodeRes;
}
export interface ErrorJikanEpisodesInfo {
  data: null;
  error: string;
}
export type JikanEpisodeInfo = SuccessJikanEpisodesInfo | ErrorJikanEpisodesInfo;
export async function getEpisodeInfo(Id: number, episodeNumber: number): Promise<JikanEpisodeInfo> {
  if (!Id && !episodeNumber) {
    return {
      error: 'Missing required parameter : Malid! || episodeNumber',
      data: null,
    };
  }

  try {
    const response = await client.get(`${jikanBaseUrl}/anime/${Id}/episodes/${episodeNumber}`);
    if (!response.data)
      return {
        error: response.statusText || 'Server returned an empty response',
        data: null,
      };
    const data = {
      number: response.data.data.mal_id,
      title: response.data.data.title,
      duration: Number(response.data.data.duration) / 60 || null,
      filler: response.data.data.filler,
      synopsis: response.data.data.synopsis,
    };
    return {
      data: data,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      data: null,
    };
  }
}

type titleRes = {
  animeId: string;
  name: string;
  romaji: string;
  score: number;
  providerName: string;
};
export interface SuccessJikanProviderId extends SuccessJIkanInfo {
  data: JIkanData;
  animeProvider: titleRes;
}
export interface ErrorJikanProviderId extends ErrorJikanInfo {
  data: null;
  animeProvider: null;
}
export type JikanProviderId = SuccessJikanProviderId | ErrorJikanProviderId;
async function getZoroProviderId(id: number): Promise<JikanProviderId> {
  if (!id) {
    return {
      error: 'Invalid or missing required parameter: MALId!',
      data: null,
      animeProvider: null,
    };
  }

  try {
    const Jikan = await getInfoById(id);
    if (!Jikan?.data?.title) {
      throw new Error('Title not found.');
    }

    const titles = Jikan.data.title;

    const userPref = titles.english || titles.romaji || titles.native;
    const slugTitle = createSlug(userPref);
    const searchZoro = async (title: string) => {
      try {
        const result = await new HiAnime().search(title);
        return (
          result.data?.map((item: any) => ({
            animeId: item.id,
            name: item.name,
            romaji: item.romaji,
            providerName: 'HiAnime',
          })) || []
        );
      } catch (error) {
        console.error('Error fetching from HiAnime:', error);
        return [];
      }
    };

    const ZoroResults = await searchZoro(slugTitle);

    const data = {
      animeInfo: Jikan,
      zoro: bestTitleMatch(titles, ZoroResults),
    };

    return {
      data: Jikan.data,
      animeProvider: data.zoro as titleRes,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
      animeProvider: null,
    };
  }
}

async function getKaiProviderId(id: number): Promise<JikanProviderId> {
  if (!id) {
    return {
      error: 'Invalid or missing required parameter: MALId!',
      data: null,
      animeProvider: null,
    };
  }

  try {
    const Jikan = await getInfoById(id);
    if (!Jikan?.data?.title) {
      throw new Error('Title not found.');
    }

    const titles = Jikan.data.title;

    const userPref = titles.english || titles.romaji || titles.native;
    const slugTitle = createSlug(userPref);

    const searchKai = async (title: string) => {
      try {
        const result = await new AnimeKai().search(title);
        return (
          result.data?.map((item: any) => ({
            animeId: item.id,
            name: item.title,
            romaji: item.romaji,
            providerName: 'AnimeKai',
          })) || []
        );
      } catch (error) {
        console.error('Error fetching from HiAnime:', error);
        return [];
      }
    };

    const KaiResults = await searchKai(slugTitle);

    const data = {
      animeInfo: Jikan,
      kai: bestTitleMatch(titles, KaiResults),
    };

    return {
      data: Jikan.data,
      animeProvider: data.kai as titleRes,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
      animeProvider: null,
    };
  }
}

export async function getAnimeProviderIdWithInfo(id: number, provider: AnimeProvider): Promise<JikanProviderId> {
  if (!id) {
    return {
      error: 'Invalid or missing required parameter: MALId!',
      data: null,
      animeProvider: null,
    };
  }
  try {
    switch (provider) {
      case AnimeProvider.Animekai:
        const response = await getKaiProviderId(id);
        return response;
      default:
        AnimeProvider.HiAnime;
        const data = await getZoroProviderId(id);
        return data;
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
      animeProvider: null,
    };
  }
}

async function fetchZoroEpisodes(malId: number) {
  const zoro = new HiAnime();
  try {
    const Jikan = await getZoroProviderId(malId);
    const result = await zoro.fetchEpisodes(Jikan.animeProvider?.animeId as string);
    return {
      jikanData: Jikan.data,
      ProviderEpisodes: result.data?.map((item: any) => ({
        episodeId: item.episodeId,
        episodeNumber: item.episodeNumber,
        title: item.title,
        provider: 'hianime',
      })),
    };
  } catch (error) {
    throw new Error(error as string).message;
  }
}

type CrossMatchedEpisodes = {
  episodeNumber: number | null;
  rating: number | null;
  aired: boolean | null;
  episodeId: string | null;
  title: string | null;
  overview: string | null;
  thumbnail: string | null;
  provider: string | null;
};

export interface SuccessEpisodesres {
  data: JIkanData;

  providerEpisodes: CrossMatchedEpisodes[];
}
export interface ErrorEpisodesres {
  data: null;
  providerEpisodes: [];
  error: string;
}
export type JikanMatchedEpisodes = SuccessEpisodesres | ErrorEpisodesres;
async function getZoroEpisodeswithInfo(jikanId: number): Promise<JikanMatchedEpisodes> {
  if (!jikanId) {
    return {
      error: 'Missing required parameter : malId',
      providerEpisodes: [],
      data: null,
    };
  }
  try {
    const [zoroProvider, aniZipData] = await Promise.all([fetchZoroEpisodes(jikanId), getMalMapping(jikanId)]);

    const aniZip = new Map(aniZipData.episodes?.map(item => [item.episodeAnizipNumber, item]));

    const ennrichedEpisodes = zoroProvider.ProviderEpisodes?.map((anime: any) => {
      const episodes = aniZip.get(anime.episodeNumber);

      return {
        episodeNumber: episodes?.episodeAnizipNumber || anime.episodeNumber || null,
        rating: episodes?.rating || null,
        aired: episodes?.aired || null,
        episodeId: anime.episodeId || null,
        title: (episodes?.title?.english || episodes?.title?.romanizedJapanese) ?? null,
        overview: episodes?.overview || 'No overview available',
        thumbnail: episodes?.image || null,
        provider: anime.provider || null,
      };
    });

    return {
      data: zoroProvider.jikanData as JIkanData,
      providerEpisodes: ennrichedEpisodes as CrossMatchedEpisodes[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      data: null,
      providerEpisodes: [],
    };
  }
}
async function fetchKaiEpisodes(malId: number) {
  const kai = new AnimeKai();
  try {
    const Jikan = await getKaiProviderId(malId);
    const result = await kai.fetchAnimeInfo(Jikan.animeProvider?.animeId as string);
    return {
      jikanData: Jikan.data,
      providerEpisodes: result.providerEpisodes.map((item: any) => ({
        episodeId: item.episodeId,
        episodeNumber: item.episodeNumber,
        title: item.title,
        provider: 'animeKai',
      })),
    };
  } catch (error) {
    throw new Error(error as string).message;
  }
}
async function getEpisodeswithInfoKai(jikanId: number): Promise<JikanMatchedEpisodes> {
  if (!jikanId) {
    return {
      error: 'Missing required parameter : MALid! ',
      providerEpisodes: [],
      data: null,
    };
  }
  try {
    const [animekai, anizipData] = await Promise.all([fetchKaiEpisodes(jikanId), getMalMapping(jikanId)]);

    const anizip = new Map(anizipData.episodes?.map(item => [item.episodeAnizipNumber, item]));

    const encrichedEpisodes = animekai.providerEpisodes?.map((anime: any) => {
      const episodes = anizip.get(anime.episodeNumber);

      return {
        episodeNumber: episodes?.episodeAnizipNumber || anime.episodeNumber || null,
        rating: episodes?.rating || null,
        aired: episodes?.aired || null,
        episodeId: anime.episodeId || null,
        title: episodes?.title?.english || episodes?.title?.romanizedJapanese || null,
        overview: episodes?.overview || 'No overview available',
        thumbnail: episodes?.image || null,
        provider: anime.provider || null,
      };
    });

    return {
      data: animekai.jikanData as JIkanData,
      providerEpisodes: encrichedEpisodes as CrossMatchedEpisodes[],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown err ',
      data: null,
      providerEpisodes: [],
    };
  }
}

export async function getAnimeProviderEpisodes(id: number, provider: AnimeProvider): Promise<JikanMatchedEpisodes> {
  if (!id) {
    return {
      error: 'Missing required parameter : id! || provider',
      data: null,
      providerEpisodes: [],
    };
  }
  try {
    switch (provider) {
      case AnimeProvider.Animekai:
        const data = await getEpisodeswithInfoKai(id);
        return data;

      default:
        AnimeProvider.HiAnime;
        const response = await getZoroEpisodeswithInfo(id);
        return response;
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
      providerEpisodes: [],
    };
  }
}
