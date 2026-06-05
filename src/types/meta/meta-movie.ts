import type { IBasePaginated, IResponse } from '../base.js';

export interface IMetaMovie {
  tmdbId: number;
  name: string;
  originalName: string;
  posterImage: {
    small: string | null;
    medium: string | null;
    large: string | null;
    original: string | null;
  };
  coverImage: {
    small: string | null;
    medium: string | null;
    large: string | null;
    original: string | null;
  };
  country?: string;
  type?: string;
  status?: string;
  language: string;
  runtime?: number;
  releaseDate: string;
  summary: string;
  genres: string;
  rating: string;
}
export interface IMovieInfo extends IMetaMovie {
  artWorks: IMetaMovieArtworks;
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
  status: string;
  episodes: number;
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
  totalEpisodes: number;
  summary: string;
  seasonNumber: string;
  posterImage: {
    small: string;
    medium: string;
    large: string;
    original: string;
  };
}

interface IArtWorks {
  height: number;
  width: number;
  small: string;
  medium: string;
  large: string;
  original: string;
}

export interface IMetaMovieArtworks {
  coverImages: IArtWorks[] | [];
  logos: IArtWorks[] | [];
  posterImages: IArtWorks[] | [];
}

export interface IMetaMovieEpisodes {
  absoluteEpisodeNumber: number | null;
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

export interface IMetaMoviePaginated<T> extends IBasePaginated<T> {
  lastPage: number;
  totalResults: number;
}
export interface IMetaMovieInfoResponse<T> extends IResponse<T> {
  images: IMetaMovieArtworks | null;
}
export interface IMetaTvInfo<T> extends IMetaMovieInfoResponse<T> {
  seasons: IMetaMovieSeasons[] | [];
}
