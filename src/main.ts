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
import type { INyaaTorrent, ITorrentDetails } from './types/torrents.js';

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
  type Browser,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
};
// const data = await new Nyaa().search('Tsue to Tsurugi no Wistoria ');
// console.log(JSON.stringify(data));
