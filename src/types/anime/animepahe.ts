import type { IBase, IBaseEpisodes, IBasePaginated, IResponse, IServerInfo } from '../base.js';

export interface IPaheAnime extends IBase {
  score: number | null;
  type: string | null;
  releaseDate: number | null;
  season: string | null;
  totalEpisodes: number | null;
}

export interface IPaheInfo extends IBase {
  anilistId: number | null;
  malId: number | null;
  altnames: string | null;
  japanese: string | null;
  status: string | null;
  genres: string[] | null;
  studios: string | null;
  romaji: string | null;
  totalEpisodes: number | null;
  duration: string | null;
  type: string | null;
  synopsis: string | null;
  releaseDate: string | null;
  externalLinks: { name: string | null; url: string | null }[];
}

export interface IPaheEpisodes extends IBaseEpisodes {
  title: string | null;
  thumbnail: string | null;
}
export interface IPaheAnimeInfoResponse<T> extends IResponse<T> {
  providerEpisodes: IPaheEpisodes[] | [];
}
export interface IPaheServersResponse<T> extends IResponse<T> {
  download: IServerInfo | null;
}

export interface IPahePaginated<T> extends IBasePaginated<T> {
  lastPage: number;
  perPage: number;
  totalResults: number;
}
