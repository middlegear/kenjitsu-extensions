export interface INyaaTorrent extends IParsedTorrentName {
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
}
export interface IParsedTorrentName {
  animeTitle: string | null;
  season: string | null;
  regexSeason: string | null;
  episode: string | null;
  year: string | null;
  releaseGroup: string | null;
  source: string | null;
  resolution: string | null;
  type: string | null;
  batch: boolean;
  complete: boolean;
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

  title: string | null;
  season: string | null;
  episode: string | null;
  regexSeason: string | null;

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

  animeTitle: string | null;
  season: string | null;
  regexSeason: string | null;
  episode: string | null;
  year: string | null;
  releaseGroup: string | null;
  source: string | null;
  resolution: string | null;
  type: string | null;
  batch: boolean;
  complete: boolean;

  groups: ITorrentFileGroup[];
  files: ITorrentFileDetails[];
}
