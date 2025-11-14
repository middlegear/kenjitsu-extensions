import type { IBaseAnime, IBaseEpisodes } from '../base.js';

export interface IAllAnime extends IBaseAnime {
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
  | 'okru'
  | 'mp4upload'
  | 'internal-s-mp4'
  | 'internal-default-hls'
  | 'internal-ak'
  | 'internal-yt-mp4'; // | 'filemoon'
