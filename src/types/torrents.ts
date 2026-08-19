export interface INyaaTorrent {
  title: string;
  link: string;
  pubDate: string;

  seeders: number;
  leechers: number;
  downloads: number;

  infoHash: string;
  size: string;

  isTrusted: boolean;
  isRemake: boolean;

  animeTitle?: string;
  season?: string;
  regexSeason?: string;
  episode?: string;
  year?: string;
  releaseGroup?: string;
  source?: string;
  resolution?: string;
  type?: string;
  batch?: boolean;
  complete?: boolean;
}

export interface TorrentStreamFile {
  name: string;
  path: string;
  length: number;
  select(): void;
  deselect(): void;
}

export interface TorrentStreamEngine {
  infoHash: string;
  files: TorrentStreamFile[];
  torrent: {
    name: string;
    infoHash: string;
    length: number;
  };
  on(event: 'ready' | 'torrent' | 'idle', callback: () => void): void;
  on(event: 'error', callback: (err: Error | string) => void): void;
  destroy(callback?: () => void): void;
}

export interface ITorrentFileDetails {
  fileIdx: number;
  fileName: string;
  path: string;
  filesize: string;
  isExtra: boolean;
  title: string | undefined;
  season: string | undefined;
  episode: string | undefined;
  regexSeason?: string;
  group: string;
}

export interface ITorrentFileGroup {
  name: string;
  fileCount: number;
  filesize: string;
}

export interface ITorrentDetails {
  name: string;
  infoHash: string;
  filesize: string;

  animeTitle?: string;
  season?: string;
  regexSeason?: string;
  episode?: string;
  year?: string;
  releaseGroup?: string;
  source?: string;
  resolution?: string;
  type?: string;
  batch?: boolean;
  complete?: boolean;

  groups: ITorrentFileGroup[];
  files: ITorrentFileDetails[];
}
