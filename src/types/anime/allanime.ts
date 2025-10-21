import type { IBaseAnime, IBaseEpisodes, ISourceBaseResponse, IVideoSource } from '../base.js';

export interface IAllAnime extends IBaseAnime {
  native: string | null;
  romaji: string | null;
}

export interface IAllAnimeEpisodes extends IBaseEpisodes {
  hasSub: boolean | null;
  hasDub: boolean | null;
  hasRaw: boolean;
}

export interface IAllAnimeServers {
  serverUrl: string;
  type: string;
  serverName: string;
  serverId: string;
}

export type AllAnimeServers =
  | 'okru'
  | 'mp4upload'
  | 'Internal-S-mp4'
  | 'Internal-default-hls'
  | 'Internal-AK'
  | 'Internal-Yt-mp4'; // | 'filemoon'

export type AllAnimeSourceResponseMap = {
  [key in AllAnimeServers]?: ISourceBaseResponse<IVideoSource | null>;
};
