import type { Browser } from 'impit';
import { Anilist } from './provider/meta/anilist.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { Anizone } from './provider/anime/anizone.js';
import type { IMetaFormat, Seasons } from './types/meta/meta-anime.js';
import type { IAnimeCategory } from './types/base.js';
import { Anikoto } from './provider/anime/anikoto.js';
import { AniDB } from './provider/anime/anidb.js';
import { AnimeHeaven } from './provider/anime/animeheaven.js';
import { AniBD } from './provider/anime/anibd.js';
import { Kitsu } from './provider/meta/kitsu.js';
import { Cinemeta } from './provider/meta/cinemeta.js';
import { MyAnimeList } from './provider/meta/mal.js';
import { Nyaa } from './provider/torrents/nyaa.js';
import type { INyaaTorrent, ITorrentDetails,ITorrentFileDetails,ITorrentFileGroup,IParsedTorrentName } from './types/torrents.js';

export {
  Anilist,
  TheMovieDatabase,
  MyAnimeList,
  Cinemeta,
  Anizone,
  Anikoto,
  AniDB,
  AniBD,
  AnimeHeaven,
  Nyaa,
  Kitsu,
  type INyaaTorrent,
  type ITorrentDetails,
  type ITorrentFileDetails,
  type ITorrentFileGroup,
  type IParsedTorrentName,
  type Browser,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
};
