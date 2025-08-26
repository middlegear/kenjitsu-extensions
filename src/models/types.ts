export interface IBaseAnime {
  id: string | null;
  name: string | null;
  romaji: string | null;
  posterImage: string | null;
}

export interface IAnime extends IBaseAnime {
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
  duration?: string | null;
  type?: string | null;
  synopsis?: string | null;
  startDate?: string | null;
  spotlight?: string | null;
  quality?: string | null;
}
export interface ISearchSuggestions extends IBaseAnime {
  startDate: string | null;
  type: string | null;
  duration: string | null;
}
export interface IAnimeInfo extends IAnime {
  anilistId: number | null;
  malId: number | null;
  altnames: string | null;
  japanese: string | null;
  rating: string | null;
  status: string | null;
  score: string | null;
  genres: string[] | null;
  studios: string[] | null;
  producers: string | null;
  synopsis: string | null;
  startDate: string | null;
  quality: string | null;
}
export interface ICharacters {
  id: string | null;
  name: string | null;
  posterImage: string | null;
  role: string | null;
  voiceActor: { id: string | null; name: string | null; posterImage: string | null; language: string | null } | null;
}
export interface IRelatedSeasons {
  id: string | null;
  name: string | null;
  season: string | null;
  seasonPoster: string | null;
}
export interface IPromotionVIds {
  url: string | null;
  title: string | null;
  thumbnail: string | null;
}
export interface IEpisodes {
  episodeId: string | null;
  episodeNumber: number | null;
  title: string | null;
}

///
export interface IResponse<T> {
  data: T;
  error?: string;
}

export interface IAnimePaginated<T> extends IResponse<T> {
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
}
export interface IRepetitiveSections<T> extends IAnimePaginated<T> {
  topAnime: { daily: IAnime[]; weekly: IAnime[]; monthly: IAnime[] };
}
export interface IAnimeInfoResponse<T> extends IResponse<T> {
  relatedSeasons: IRelatedSeasons[];
  recommendedAnime: IAnime[];
  mostPopular: IAnime[];
  promotionVideos: IPromotionVIds[];
  relatedAnime: IAnime[];
  characters: ICharacters[];
}
export interface IHomeResponse<T> extends IResponse<T> {
  trending: IBaseAnime[];
  topAiring: IAnime[];
  mostPopular: IAnime[];
  favourites: IAnime[];
  recentlyCompleted: IAnime[];
  topAnime: { daily: IAnime[]; weekly: IAnime[]; monthly: IAnime[] };
  recentlyAdded: IAnime[];
  recentlyUpdated: IAnime[];
}
export interface HISourceResponse<T> extends IResponse<T> {
  headers: {
    Referer: string | null;
  };
  syncData: {
    anilistId: string | null;
    malId: string | null;
    name: string | null;
  };
}

interface ISubtitles {
  url: string | null;
  lang: string | null;
  default?: boolean | null;
}
interface IOutro {
  start: number | null;
  end: number | null;
}
export interface IVideoSource {
  intro?: IOutro;
  outro?: IOutro;
  subtitles: ISubtitles[];
  sources: ISource[];
  download?: string;
}
interface ISource {
  url: string | null;
  isM3U8: boolean | null;
  type: string | null;
}
export interface ISubServers {
  serverId: number | null;
  serverName: string | null;
  mediaId: number | null;
}
export type IDubServers = ISubServers;
export type IRawServers = ISubServers;

export interface HIServerInfo {
  sub: ISubServers[];
  dub: IDubServers[];
  raw: IRawServers[];
  episodeNumber: number | null;
}
export const HISubOrDub = {
  SUB: 'sub',
  DUB: 'dub',
  RAW: 'raw',
} as const;
export type HISubOrDub = (typeof HISubOrDub)[keyof typeof HISubOrDub];

export const HiAnimeServers = {
  HD1: 'hd-1',
  HD2: 'hd-2',
  HD3: 'hd-3',
} as const;
export type HiAnimeServers = (typeof HiAnimeServers)[keyof typeof HiAnimeServers];
export const HIGenres = [
  'action',
  'adventure',
  'cars',
  'comedy',
  'dementia',
  'demons',
  'drama',
  'ecchi',
  'fantasy',
  'game',
  'harem',
  'historical',
  'horror',
  'isekai',
  'josei',
  'kids',
  'magic',
  'martial-arts',
  'mecha',
  'military',
  'music',
  'mystery',
  'parody',
  'police',
  'psychological',
  'romance',
  'samurai',
  'school',
  'sci-fi',
  'seinen',
  'shoujo',
  'shoujo-ai',
  'shounen',
  'shounen-ai',
  'slice-of-life',
  'space',
  'sports',
  'super-power',
  'supernatural',
  'thriller',
  'vampire',
] as const;

export type HIGenres = (typeof HIGenres)[number];
