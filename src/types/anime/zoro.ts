import type { IBaseAnime, IBasePaginated, IHomeResSpecialPages, IResponse, ISourceBaseResponse } from '../base.js';

export interface IZBase extends IBaseAnime {
  romaji: string | null;
}
export interface IZAnime extends IZBase {
  type?: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
}
export interface IZSearchSuggestions extends IZBase {
  releaseDate: string | null;
  type: string | null;
  duration: string | null;
}
export interface IZSpotlight extends IZAnime {
  spotlight?: string | null;
  synopsis: string | null;
  releaseDate: string | null;
  quality: string | null;
}

export interface IZAnimeInfo extends IZSpotlight {
  anilistId: number | null;
  malId: number | null;
  altnames: string | null;
  japanese: string | null;
  status: string | null;
  score: string | null;
  genres: string[] | null;
  studios: string[] | null;
  rating: string | null;
  producers: string[] | null;
}

export interface IZRelatedSeasons {
  id: string | null;
  name: string | null;
  season: string | null;
  seasonPoster: string | null;
}

export interface IZPromotionVIds {
  url: string | null;
  title: string | null;
  thumbnail: string | null;
}
export interface IZCharacters {
  id: string | null;
  name: string | null;
  posterImage: string | null;
  role: string | null;
  voiceActor: { id: string | null; name: string | null; posterImage: string | null; language: string | null } | null;
}

export interface IZEpisodes {
  episodeId: string | null;
  episodeNumber: number | null;
  romaji: string | null;
  title: string | null;
}
export type HiAnimeServers = 'hd-1' | 'hd-2' | 'hd-3';

export interface IZPaginated<T> extends IBasePaginated<T> {
  lastPage: number;
}
export interface IZHomeResponse<T> extends IHomeResSpecialPages {
  data: IZAnime[];
  trending: IZBase[];
  topAiring: IZAnime[];
  mostPopular: IZAnime[];
  recentlyUpdated: IZAnime[];
  recentlyCompleted: IZAnime[];
  recentlyAdded: IZAnime[];
  favourites: IZAnime[];
  topAnime: { daily: IZAnime[]; weekly: IZAnime[]; monthly: IZAnime[] };
}
export interface IZPaginatedSections<T> extends IZPaginated<T> {
  topAnime: { daily: IZAnime[]; weekly: IZAnime[]; monthly: IZAnime[] };
}
export interface IZSourceResponse<T> extends ISourceBaseResponse<T> {
  syncData?: {
    anilistId: string | null;
    malId: string | null;
    name: string | null;
  };
}

export interface IZoroAnimeInfoScrape<T> extends IResponse<T> {
  relatedSeasons: IZRelatedSeasons[] | [];
  recommendedAnime: IZAnime[] | [];
  relatedAnime: IZAnime[] | [];
  mostPopular: IZAnime[];
  promotionVideos: IZPromotionVIds[];
  characters: IZCharacters[];
}

export interface IZoroInfoResponse<T> extends IZoroAnimeInfoScrape<T> {
  providerEpisodes: IZEpisodes[] | [];
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
