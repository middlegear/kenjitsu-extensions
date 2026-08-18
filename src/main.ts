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
  Kitsu,
  type Browser,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
};
// const data = await new Nyaa().fetchInfoHashDetails('733970bd6cd2fd13a4cbbccf0f01e56780710007');
// console.log(JSON.stringify(data));
