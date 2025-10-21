import type { IBasePaginated, IResponse } from '../base.js';

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
  externalIds: IMetaExternalId;
}
interface IMetaExternalId {
  imdbId: string | null;
  tvdbId?: number | null;
  tvrageId?: number | null;
  facebookId: string | null;
  instagramId: string | null;
  twitterId: string | null;
  wikidataId: string | null;
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
  id: string | null;
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

export interface IMetaMoviePaginated<T> extends IBasePaginated<T> {
  lastPage: number;
  totalResults: number;
}

export interface IMetaInfoResponse<T> extends IResponse<T> {
  seasons: IMetaMovieSeasons[] | [];
}
export interface IMetaMovieIdResponse<T> extends IResponse<T> {
  provider: IMovieProviderResults | null;
}
