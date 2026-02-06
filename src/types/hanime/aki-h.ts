import type { IBase, IBaseEpisodes, IResponse } from '../base.js';

export interface AKiBase extends IBase {
  native: string | null;
}
export interface AKiAnime extends AKiBase {
  type?: string | null;
  totalEpisodes?: number | null;
}
export interface AKiHSpotlight extends AKiAnime {
  spotlight?: string | null;
  synopsis: string | null;
  releaseDate: string | null;
  quality?: string | string[] | null;
}

export interface IAKiInfo extends AKiHSpotlight {
  status: string | null;
  genres: string[] | null;
  studios: string[] | null;
}

export interface IAKiEpisodes {
  episodeId: string | null;
  title: string | null;
  thumbnail: string | null;
}

export interface IAKiInfoResponse<T> extends IResponse<T> {
  providerEpisodes: IAKiEpisodes[] | [];
}
export interface AKiHomeResponse<T> extends IResponse<T> {
  recentlyUpdated: AKiAnime[] | [];
  mostPopular: AKiAnime[] | [];
}
