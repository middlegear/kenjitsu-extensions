
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
  name: string;
  path: string;
  filesize: string;
  isExtra: boolean;
}
export interface ITorrentFileGroup {
  name: string;
  fileCount: number;
  filesize: string;

}
export interface ITorrentDetails {
  name: string;
  infoHash: string;
  sources: string[];
  filesize: string;
  title: string;
  groups: ITorrentFileGroup[];
  files: ITorrentFileDetails[];
}
