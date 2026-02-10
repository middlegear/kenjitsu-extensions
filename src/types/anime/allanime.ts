import type { IBase, IBaseEpisodes } from '../base.js';
export interface IAllAnimeInfo extends IBase {
  native: string;
  type: string;
  season: string;
  releaseDate: number;
  score: number;
  genres: string[];
  synopsis: string;
  studios?: string[];
  status: string;
}
export interface IAllAnime extends IBase {
  native: string | null;
  romaji: string | null;
}

export interface IAllAnimeEpisodes extends IBaseEpisodes {
  hasSub: boolean | null;
  hasDub: boolean | null;
  hasRaw: boolean;
}

export interface IAllAnimeServersInfo {
  serverUrl: string;
  type: string;
  serverName: string;
  serverId: string;
}

export type AllAnimeServers =
  // | 'okru' remove okru
  'mp4upload' | 'internal-s-mp4' | 'internal-default-hls' | 'internal-ak' | 'internal-yt-mp4'; // | 'filemoon';
