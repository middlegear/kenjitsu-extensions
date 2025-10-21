import type { IBaseAnime, IBaseEpisodes, IBasePaginated, IResponse, IServerInfo } from '../base.js';

export interface IPaheAnime extends IBaseAnime {
  score: number | null;
  type: string | null;
  releaseDate: number | null;
  season: string | null;
  totalEpisodes: number | null;
}
export interface IPaheReleases {
  id: string | null;
  name: string | null;
  episodeNumber: number | null;
  thumbnail: string | null;
}

export interface IPaheInfo extends IBaseAnime {
  anilistId: number | null;
  malId: number | null;
  altnames: string | null;
  japanese: string | null;
  status: string | null;
  score: string | null;
  genres: string[] | null;
  studios: string | null;
  producers: string | null;
  romaji: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
  totalEpisodes: number | null;
  duration: string | null;
  type: string | null;
  synopsis: string | null;
  releaseDate: string | null;
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
