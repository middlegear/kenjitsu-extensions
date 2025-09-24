export interface IBaseAnime {
  id: string | null;
  name: string | null;
  romaji: string | null;
  native?: string | null;
  posterImage: string | null;
}
export interface IMetaData {
  native?: string;
  english: string;
  romaji: string;
  ///added for animepahe
  type: string;
  season: string;
  year: number;
  episodes: number;
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
  releaseDate?: string | null;
  spotlight?: string | null;
  quality?: string | null;
}

export interface IPaheAnime {
  id: string | null;
  name: string | null;
  romaji: string | null;
  posterImage: string | null;
  score: number | null;
  type: string | null;
  releaseDate: number | null;
  season: string | null;
  totalEpisodes: number | null;
}
export interface ISearchSuggestions extends IBaseAnime {
  releaseDate: string | null;
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
  studios: string[] | string | null;
  producers: string | string[] | null;
  releaseDate: string | null;
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
  thumbnail?: string | null;
  romaji?: string | null;
  title?: string | null;
}

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
export interface IPaheAnimeInfoResponse<T> extends IResponse<T> {
  providerEpisodes: IEpisodes[] | [];
}
export interface IHIAnimeInfoResponse<T> extends IPaheAnimeInfoResponse<T> {
  relatedSeasons: IRelatedSeasons[] | [];
  recommendedAnime: IAnime[] | [];
  relatedAnime: IAnime[] | [];
  mostPopular: IAnime[] | [];
  promotionVideos: IPromotionVIds[] | [];
  characters: ICharacters[] | [];
}
export interface IAnimeKaiInfoResponse<T> extends IResponse<T> {
  relatedSeasons: IRelatedSeasons[] | [];
  recommendedAnime: IAnime[] | [];
  relatedAnime: IAnime[] | [];
  providerEpisodes?: IAllAnimeEpisodes[] | [];
}
export interface IAnimeInfoResponse<T> extends IAnimeKaiInfoResponse<T> {
  mostPopular: IAnime[];
  promotionVideos: IPromotionVIds[];
  characters: ICharacters[];
}
export interface IHomeResponse<T> extends IBaseHomeResponse<T> {
  data: IAnime[];
  trending: IBaseAnime[];
  topAiring: IAnime[];
  mostPopular: IAnime[];
  favourites: IAnime[];
  topAnime: { daily: IAnime[]; weekly: IAnime[]; monthly: IAnime[] };
}
export interface IBaseHomeResponse<T> extends IHomeResSpecialPages {
  recentlyUpdated: IAnime[];
  recentlyCompleted: IAnime[];
  recentlyAdded: IAnime[];
}

export interface IAHomeResponse<T> extends IBaseHomeResponse<T> {
  data: IAnime[];
  trending: { now: IAnime[]; daily: IAnime[]; weekly: IAnime[]; monthly: IAnime[] };
  upcoming: IAnime[];
}

export type AllAnimeSourceResponseMap = {
  [key in AllAnimeServers]?: IVideoSourceResponse<IVideoSource | null>;
};

export interface HISourceResponse<T> extends ISourceBaseResponse<T> {
  syncData?: {
    anilistId: string | null;
    malId: string | null;
    name: string | null;
  };
}
export interface ISourceBaseResponse<T> extends IResponse<T> {
  headers: {
    Referer: string | null;
  };
}
export interface ISubtitles {
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
  quality?: string | null;
}
export interface ISubServers {
  serverId: number | string | null;
  serverName: string | null;
  mediaId: number | string | null;
  eid?: string | null;
}
export type IDubServers = ISubServers;
export type IRawServers = ISubServers;

export interface HIServerInfo {
  sub: ISubServers[];
  dub: IDubServers[];
  raw: IRawServers[];
  episodeNumber: number | null;
}

export type ISubOrDub = 'sub' | 'dub' | 'raw';

export type HiAnimeServers = 'hd-1' | 'hd-2' | 'hd-3';

///'streamwish', has been omited since the extractor method isnt ready a
export type AllAnimeServers = 'okru' | 'filemoon' | 'mp4upload';

export type AKserver = {
  url: string;
  intro: { start: number | null; end: number | null };
  outro: { start: number | null; end: number | null };
  download: string;
};

export interface IAllAnimeEpisodes extends IEpisodes {
  hasSub: boolean | null;
  hasDub: boolean | null;
  hasRaw?: boolean;
}
export interface IAllAnimeServers {
  serverUrl: string;
  type: string;
  serverName: string;
  serverId: string;
}

export interface IVideoSourceResponse<T> extends IResponse<T> {
  headers: {
    Referer: string | null;
  };
}

export const HIGenres = {
  action: 'action',
  adventure: 'adventure',
  cars: 'cars',
  comedy: 'comedy',
  dementia: 'dementia',
  demons: 'demons',
  drama: 'drama',
  ecchi: 'ecchi',
  fantasy: 'fantasy',
  game: 'game',
  harem: 'harem',
  historical: 'historical',
  horror: 'horror',
  isekai: 'isekai',
  josei: 'josei',
  kids: 'kids',
  magic: 'magic',
  'martial-arts': 'martial-arts',
  mecha: 'mecha',
  military: 'military',
  music: 'music',
  mystery: 'mystery',
  parody: 'parody',
  police: 'police',
  psychological: 'psychological',
  romance: 'romance',
  samurai: 'samurai',
  school: 'school',
  'sci-fi': 'sci-fi',
  seinen: 'seinen',
  shoujo: 'shoujo',
  'shoujo-ai': 'shoujo-ai',
  shounen: 'shounen',
  'shounen-ai': 'shounen-ai',
  'slice-of-life': 'slice-of-life',
  space: 'space',
  sports: 'sports',
  'super-power': 'super-power',
  supernatural: 'supernatural',
  thriller: 'thriller',
  vampire: 'vampire',
} as const;

export type HIGenre = keyof typeof HIGenres;

export const AKGenres = {
  action: 'action',
  adventure: 'adventure',
  'avant-garde': 'avant-garde',
  'boys-love': 'boys-love',
  comedy: 'comedy',
  demons: 'demons',
  drama: 'drama',
  ecchi: 'ecchi',
  fantasy: 'fantasy',
  'girls-love': 'girls-love',
  gourmet: 'gourmet',
  harem: 'harem',
  horror: 'horror',
  isekai: 'isekai',
  iyashikei: 'iyashikei',
  josei: 'josei',
  kids: 'kids',
  magic: 'magic',
  'mahou-shoujo': 'mahou-shoujo',
  'martial-arts': 'martial-arts',
  mecha: 'mecha',
  military: 'military',
  music: 'music',
  mystery: 'mystery',
  parody: 'parody',
  psychological: 'psychological',
  'reverse-harem': 'reverse-harem',
  romance: 'romance',
  school: 'school',
  'sci-fi': 'sci-fi',
  seinen: 'seinen',
  shoujo: 'shoujo',
  shounen: 'shounen',
  'slice-of-life': 'slice-of-life',
  space: 'space',
  sports: 'sports',
  'super-power': 'super-power',
  supernatural: 'supernatural',
  suspense: 'suspense',
  thriller: 'thriller',
  vampire: 'vampire',
} as const;

export type KaiGenres = keyof typeof AKGenres;

export interface IPaheServersResponse<T> extends IResponse<T> {
  download: HIServerInfo | null;
}
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
  releaseDate: string;
  endDate: string;
  studio: string;
  producers: string[];
}

export const Seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const;
export type Seasons = (typeof Seasons)[number];

export const JSort = ['airing', 'bypopularity', 'upcoming', 'favorite', 'rating'] as const;
export type JSort = (typeof JSort)[number];

export type IMetaFormat = 'TV' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';

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

export interface IProviderId {
  id: string | null;
  name: string | null;
  native?: string | null;
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
// Base interface for common fields
interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

interface NextAiringEpisode {
  episode: number;
  id: number;
  airingAt: number;
  timeUntilAiring: number;
}

interface BaseAnimeSchedule {
  malId: number;
  anilistId: number;
  bannerImage: string;
  image: string;
  title: AnimeTitle;
  format: string;
  releaseDate: string;
  endDate: string;
  status: string;
  nextAiringEpisode: NextAiringEpisode | null;
}

export interface MediaSchedule extends BaseAnimeSchedule {
  color: string;
  duration: number | null;
}

export interface AiringSchedule extends BaseAnimeSchedule {
  popularity: number;
  score: number;
  genres: string[];
  episodes: number | null;
  synopsis: string;
  season: string | null;
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
  runtime?: number;
  releaseDate: string;
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
  name: string | null;
  // TV-specific
  seasons?: number | null;
  totalEpisodes?: number | null;
  // Movie-specific
  releaseDate?: number | null;
  duration?: number | string | null;
  provider?: string | null;
  score?: number;
}
export interface IMetaMovieIdResponse<T> extends IResponse<T> {
  provider: IMovieProviderResults | null;
}

///// Movies and Tv
export interface IMovieTvBase {
  id: string | null;
  name: string | null;
  posterImage: string | null;
  type: 'Movie' | 'TV' | null;
  quality?: string | null;
}
export interface IMovieSlider extends IMovieTvBase {
  synopsis: string | null;
  score: number | null;
  duration: string | null;
  genre: string[] | null;
}
export interface IMovie extends IMovieTvBase {
  type: 'Movie';
  releaseDate: string | number | null;
  duration: string | null;
}

export interface ITvShow extends IMovieTvBase {
  type: 'TV';
  seasons: number | null;
  totalEpisodes: number | null;
}

export interface IMovieInfo extends IMovieTvBase {
  releaseDate: string | null;
  synopsis: string | null;
  duration: string | null;
  production: string[] | null;
  country: string[] | null;
  casts: string[] | null;
  trailer: string | null;
  score: number | null;
  genre: string[] | null;
}
export type IMovieOrTv = IMovie | ITvShow;

export interface IMovieInfoResponse<T> extends IResponse<T> {
  recommended: IMovieOrTv[] | [];
  providerEpisodes: IMovieEpisodes[] | [];
}

export interface IMovieEpisodes {
  title: string | null;
  episodeId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
}

export interface IMovieServers {
  serverId: string | null;
  serverName: string | null;
}

export interface IHomeResSpecialPages {
  error?: string;
}

export interface IHomeHIResponse<T> extends IHomeResSpecialPages {
  featured?: IMovieSlider[] | [];
  trending: {
    Movies: IMovieOrTv[] | [];
    Tv: IMovieOrTv[] | [];
  };
  recentReleases: {
    Movies: IMovieOrTv[] | [];
    Tv: IMovieOrTv[] | [];
  };
  upcoming: IMovieOrTv[] | [];
}

export const HIMovieGenres = {
  action: 'action',
  actionandadventure: 'action-adventure',
  adventure: 'adventure',
  animation: 'animation',
  biography: 'biography',
  comedy: 'comedy',
  crime: 'crime',
  documentary: 'documentary',
  drama: 'drama',
  family: 'family',
  fantasy: 'fantasy',
  history: 'history',
  horror: 'horror',
  kids: 'kids',
  music: 'music',
  mystery: 'mystery',
  news: 'news',
  reality: 'reality',
  romance: 'romance',
  scifiandfantasy: 'sci-fi-fantasy',
  sciencefiction: 'science-fiction',
  soap: 'soap',
  talk: 'talk',
  thriller: 'thriller',
  tvmovie: 'tv-movie',
  war: 'war',
  warandpolitics: 'war-politics',
  western: 'western',
} as const;

export type IMovieGenre = keyof typeof HIMovieGenres;

export const HIMovieCountryCode = {
  argentina: 'AR',
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  brazil: 'BR',
  canada: 'CA',
  china: 'CN',
  czechrepublic: 'CZ',
  denmark: 'DK',
  finland: 'FI',
  france: 'FR',
  germany: 'DE',
  hongkong: 'HK',
  hungary: 'HU',
  india: 'IN',
  ireland: 'IE',
  israel: 'IL',
  italy: 'IT',
  japan: 'JP',
  luxembourg: 'LU',
  mexico: 'MX',
  netherlands: 'NL',
  newzealand: 'NZ',
  norway: 'NO',
  poland: 'PL',
  romania: 'RO',
  russia: 'RU',
  southafrica: 'ZA',
  southkorea: 'KR',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  taiwan: 'TW',
  thailand: 'TH',
  unitedkingdom: 'GB',
  unitedstates: 'US',
} as const;

export type IMovieCountry = keyof typeof HIMovieCountryCode;

export const HIMoviesCountryID = {
  argentina: '11',
  australia: '151',
  austria: '4',
  belgium: '44',
  brazil: '190',
  canada: '147',
  china: '101',
  czechrepublic: '231',
  denmark: '222',
  finland: '158',
  france: '3',
  germany: '96',
  hongkong: '93',
  hungary: '72',
  india: '105',
  ireland: '196',
  israel: '24',
  italy: '205',
  japan: '173',
  luxembourg: '91',
  mexico: '40',
  netherlands: '172',
  newzealand: '122',
  norway: '219',
  poland: '23',
  romania: '170',
  russia: '109',
  southafrica: '200',
  southkorea: '135',
  spain: '62',
  sweden: '114',
  switzerland: '41',
  taiwan: '119',
  thailand: '57',
  unitedkingdom: '180',
  unitedstates: '129',
} as const;

export const HIMoviesGenreID = {
  action: '10',
  actionandadventure: '24',
  adventure: '18',
  animation: '3',
  biography: '37',
  comedy: '7',
  crime: '2',
  documentary: '11',
  drama: '4',
  family: '9',
  fantasy: '13',
  history: '19',
  horror: '14',
  kids: '27',
  music: '15',
  mystery: '1',
  news: '34',
  reality: '22',
  romance: '12',
  scifiandfantasy: '31',
  sciencefiction: '5',
  soap: '35',
  talk: '29',
  thriller: '16',
  tvmovie: '8',
  war: '17',
  warandpolitics: '28',
  western: '6',
} as const;
