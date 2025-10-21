import type { IBaseAnime, IBaseEpisodes, IResponse } from '../base.js';

export interface IAnizone extends IBaseAnime {
  releaseDate: string | number | null;
  status: string | null;
  genres: string[] | null;
  type: string | null;
}

export interface IAnizoneInfo extends IAnizone {
  coverImage: string | null;
  synopsis: string | null;
  totalEpisodes: number | null;
}

export interface IAniZoneEpisodes extends IBaseEpisodes {
  thumbnail: string | null;
  teaser: string | null;
  airDate: string | null;
  title: string | null;
}

export interface IAnizoneInfoResponse<T> extends IResponse<T> {
  providerEpisodes: IAniZoneEpisodes[] | [];
}
export interface IAnizoneUpdates<T> extends IResponse<T> {
  recentlyAdded: IBaseAnime[] | [];
}
