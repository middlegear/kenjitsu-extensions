import type { IBasePaginated, IResponse } from '../base.js';

export interface IMetaAnime {
  malId: number;
  anilistId?: number;
  image: string;
  color?: string;
  bannerImage?: string;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  trailer: string;
  format: string;
  status: string;
  synonyms?: string[];
  country?: string;
  year?: number;
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

export interface IRelatedAnilistData {
  anilistId: number;
  relationType: any;
  malId: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  format: string;
  type: string;
  score: number;
  image: string;
  bannerImage: string;
  color: string;
  synonyms: string[];
  country: string;
  year: number;
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
  title: { romaji: string; english: string | null; native: string | null };
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

export const Seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const;
export type Seasons = (typeof Seasons)[number];

export type IMetaFormat = 'TV' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA';

export interface IMetaAnimePaginated<T> extends IBasePaginated<T> {
  lastPage: number;
  perPage: number;
  // totalResults: number;
}
export interface IMetaProviderEpisodes {
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
  provider?: IProviderId | null;
}
export interface IProviderId {
  id: string | number | null;
  name: string | null;
  native?: string | null;
  romaji: string | null;
  provider: string | null;
  score: number | null;
  source?: string | null;
}
export interface IMetaProviderIdResponse<T> extends IResponse<T> {
  provider: IProviderId | null;
}

export interface IRelatedKitsuData {
  kitsuId: string;
  relationType: string;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  type: string;
  format: string;
  synonyms: string[] | null;
  year: number | null;
  startDate: string | null;
  endDate: string | null;
  score: number | null;
  image: string | null;
  bannerImage: string | null;
}
export interface IKitsuAnime {
  kitsuId: number;

  isAdult: boolean;
  slug: string;

  image: string | null;
  bannerImage: string | null;

  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };

  trailer: {
    id: string;
    site: string;
  } | null;

  format: string | null;

  synonyms: string[];

  status: string | null;

  releaseDate: string | null;
  endDate: string | null;

  duration: number | null;
  episodes: number | null;

  score: number | null;

  synopsis: string | null;
}

export interface IKitsuEpisode {
  episodeId: number;
  thumbnail: string | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  airDate: string | null;
  seasonNumber: number;
  episodeNumber: number;
  relativeNumber: number;
  synopsis: string | null;
}
