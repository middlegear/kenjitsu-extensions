export interface IBaseAnime {
  id: string | null;
  name: string | null;
  romaji: string | null;
  posterImage: string | null;
}
export interface ITitle {
  native?: string;
  english: string;
  romaji: string;
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
  perPage?: number;
  totalResults?: number;
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
export const HISubOrDub = ['sub', 'dub', 'raw'] as const;
export type HISubOrDub = (typeof HISubOrDub)[number];

export const HiAnimeServers = ['hd-1', 'hd-2', 'hd-3'] as const;
export type HiAnimeServers = (typeof HiAnimeServers)[number];
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

export interface IMetaAnime {
  malId: number;
  anilistId?: number;
  image: string;
  color?: string;
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
  genres: string[];
  episodes: number;
  synopsis: string;
  season: string;
  startDate: string;
  endDate: string;
  studio: string;
  producers: string[];
}

export const Sort = ['SCORE_DESC', 'POPULARITY_DESC'] as const;
export type Sort = (typeof Sort)[number];

export const Seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const;
export type Seasons = (typeof Seasons)[number];

export const JikanStatus = ['airing', 'bypopularity', 'upcoming', 'favorite'] as const;
export type JikanStatus = (typeof JikanStatus)[number];

export const AnilistStatus = ['NOT_YET_RELEASED', 'RELEASING'] as const;
export type AnilistStatus = (typeof AnilistStatus)[number];

export const Format = {
  TV: 'TV',
  MOVIE: 'MOVIE',
  SPECIAL: 'SPECIAL',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'MUSIC',
} as const;
export type Format = (typeof Format)[keyof typeof Format];

export const Charactersort = {
  RELEVANCE: 'RELEVANCE',
} as const;
export type Charactersort = (typeof Charactersort)[keyof typeof Charactersort];
export interface IRelatedAnilistData {
  anilistId: number;
  malId: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  type: string;
  score: number;
  image: string;
  bannerImage: string;
  color: string;
}
export interface IMetaCharacters {
  role: string;
  id: number;
  name: string;
  image: string;
  voiceActors: voiceActors[];
}
type voiceActors = {
  name: string;
  image: string;
  language: string;
};

export interface IAnilistCharacters {
  anilistId: number;
  malId: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  characters: IMetaCharacters[];
}
export const AnimeProvider = {
  HiAnime: 'hianime',
  Animekai: 'animekai',
} as const;
export type AnimeProvider = (typeof AnimeProvider)[keyof typeof AnimeProvider];
export interface IProviderId {
  id: string | null;
  name: string | null;
  romaji: string | null;
  provider: string | null;
  score: number | null;
}
export interface IMetaProviderIdResponse<T> extends IResponse<T> {
  provider: IProviderId | null;
}

interface MetaProviderEpisodes {
  episodeNumber: number | null;
  rating: number | null;
  aired: boolean | null;
  episodeId: string | null;
  title: string | null;
  overview: string | null;
  thumbnail: string | null;
  provider: string | null;
}
export interface IMetaProviderEpisodesResponse<T> extends IResponse<T> {
  providerEpisodes: MetaProviderEpisodes[] | [];
}
