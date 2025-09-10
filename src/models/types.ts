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
export type IAnimeCategory = 'MOVIE' | 'TV' | 'ONA' | 'OVA' | 'SPECIALS';
export interface IAnime extends IBaseAnime {
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
  duration?: string | null;
  rating?: string | null;
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
  status: string | null;
  score: string | null;
  genres: string[] | null;
  studios: string[] | null;
  producers: string | string[] | null;
  startDate: string | null;
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
  totalEpisodes?: number | null;
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
  romaji: string | null;
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
  lastPage?: number;
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
export interface IHomeResponse<T> extends IBaseHomeResponse<T> {
  trending: IBaseAnime[];
  topAiring: IAnime[];
  mostPopular: IAnime[];
  favourites: IAnime[];
  topAnime: { daily: IAnime[]; weekly: IAnime[]; monthly: IAnime[] };
}
export interface IBaseHomeResponse<T> extends IResponse<T> {
  recentlyUpdated: IAnime[];
  recentlyCompleted: IAnime[];
  recentlyAdded: IAnime[];
}

export interface IAHomeResponse<T> extends IBaseHomeResponse<T> {
  trending: { now: IAnime[]; daily: IAnime[]; weekly: IAnime[]; monthly: IAnime[] };
  upcoming: IAnime[];
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
  subtitles?: ISubtitles[];
  sources: ISource[];
  download?: string | null;
  posterImage?: string | null;
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
///'streamwish', has been omited since the extractor method isnt ready and i dont know which referer headers work best
export const AllAnimeServers = ['okru', 'filemoon', 'mp4upload'] as const;
export type AllAnimeServers = (typeof AllAnimeServers)[number];

export interface IAllAnimeEpisodes {
  episodeNumber: number;
  episodeId: string;
  hasSub: boolean;
  hasDub: boolean;
  hasRaw: boolean;
}
export interface IAllAnimeServers {
  serverUrl: string;
  type: string;
  serverName: string;
  serverId: string;
}
export interface IAllSearch {
  id: string;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  thumbnail: string;
  slugTime: string;
}
export interface AllAnimeSourceResponse<T> extends IResponse<T> {
  headers: {
    Referer: string | null;
  };
}
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
const AKGenres = [
  'action',
  'adventure',
  'avant-garde',
  'boys-love',
  'comedy',
  'demons',
  'drama',
  'ecchi',
  'fantasy',
  'girls-love',
  'gourmet',
  'harem',
  'horror',
  'isekai',
  'iyashikei',
  'josei',
  'kids',
  'magic',
  'mahou-shoujo',
  'martial-arts',
  'mecha',
  'military',
  'music',
  'mystery',
  'parody',
  'psychological',
  'reverse-harem',
  'romance',
  'school',
  'sci-fi',
  'seinen',
  'shoujo',
  'shounen',
  'slice-of-life',
  'space',
  'sports',
  'super-power',
  'supernatural',
  'suspense',
  'thriller',
  'vampire',
] as const;

export type AKGenres = (typeof AKGenres)[number];
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

export const JSort = ['airing', 'bypopularity', 'upcoming', 'favorite', 'rating'] as const;
export type JSort = (typeof JSort)[number];

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
  // Animekai: 'animekai',
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

interface IMetaProviderEpisodes {
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
  providerEpisodes: IMetaProviderEpisodes[] | [];
}
export interface IMetaEpisodes {
  number: number;
  title: {
    english: string;
    romaji: string;
    japanese: string;
  };
  filler: boolean;
  duration?: number | null;
  synopsis?: string;
  recap: boolean;
  score?: number;
  url: string;
}

export interface IMetaMovie {
  tmdbId: number;
  name: string;
  posterImage: {
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  coverImage: {
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  country?: string;
  language: string;
  startDate: string;
  summary: string;
  genres: string;
  rating: string;
}

export interface IMetaMovieInfo extends IMetaMovie {
  lastAired: string;
  seasons: number;
  latestEpisode: {
    episodeId: string;
    title: string;
    episodeNumber: number;
    episodeType: string;
    season: number;
    summary: string;
    rating: number;
    airDate: string;
  } | null;
  nextEpisode: {
    episodeId: number;
    title: string;
    episodeType: string;
    episodeNumber: number;
    season: number;
    summary: string;
    rating: number;
    airDate: string;
  } | null;
}
export interface IMetaMovieSeasons {
  airDate: string;
  id: string;
  name: string;
  rating: string;
  summary: string;
  seasonNumber: string;
  posterImage: {
    small: string;
    medium: string;
    large: string;
    original: string;
  };
}
export interface IMetaInfoResponse<T> extends IResponse<T> {
  seasons: IMetaMovieSeasons[] | [];
}

export interface IMetaMovieEpisodes {
  airDate: string | null;
  episodeNumber: number | null;
  episodeType?: string | null;
  tmdbEpisodeId: number | null;
  title: string | null;
  summary: string | null;
  rating: number | null;
  seasonNumber: number | null;
  tmdbId?: number | null;
  runtime: string | null;
  images: {
    small: string;
    medium: string;
    large: string;
    original: string;
  };
}

export interface IMovieProviderResults {
  id: string;
  title: string;
  url: string;
  seasons?: number;
  releaseDate?: number;
  quality: string;
}
export interface IMetaMovieIdResponse<T> extends IResponse<T> {
  provider: IMovieProviderResults[] | [];
}
export const TimeWindow = {
  Day: 'day',
  Week: 'week',
} as const;
export type TimeWindow = (typeof TimeWindow)[keyof typeof TimeWindow];
