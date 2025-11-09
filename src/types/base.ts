export interface IBaseAnime {
  id: string | null;
  name: string | null;
  //   romaji: string | null;
  //   native?: string | null;
  posterImage: string | null;
}

export interface IBaseEpisodes {
  episodeId: string | null;
  episodeNumber: number | null;
}

export interface ISubServers {
  serverId: number | string | null;
  serverName: string | null;
  mediaId: number | string | null;
  eid?: string | null;
}
export type IDubServers = ISubServers;
export type IRawServers = ISubServers;

export interface IServerInfo {
  sub: ISubServers[];
  dub: IDubServers[];
  raw: IRawServers[];
  episodeNumber: number | null;
}

export type ISubOrDub = 'sub' | 'dub' | 'raw';

export interface IResponse<T> {
  data: T;
  error?: string;
}

export interface ISubtitles {
  url: string | null;
  lang: string | null;
  default?: boolean | null;
}
interface IOutro {
  start: number | null;
  end: number | null;
}
interface ITracks {
  url: string | null;
  type: string | null;
  quality?: string | null;
}
export interface IVideoSource {
  intro?: IOutro;
  outro?: IOutro;
  subtitles?: ISubtitles[];
  tracks?: ITracks[];
  sources: ISource[];
  download?: string | null;
  posterImage?: string | null;
}
export interface ISource {
  url: string | null;
  isM3u8: boolean | null;
  type: string | null;
  quality?: string | null;
}

export type IAnimeCategory = 'MOVIE' | 'TV' | 'ONA' | 'OVA' | 'SPECIALS';

export interface ISourceBaseResponse<T> extends IResponse<T> {
  headers: {
    Referer: string | null;
  };
}
export interface IBasePaginated<T> extends IResponse<T> {
  hasNextPage: boolean;
  currentPage: number;
}

export interface IHomeResSpecialPages {
  error?: string;
}
