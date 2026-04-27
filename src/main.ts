import { Anilist } from './provider/meta/anilist.js';
import { FlixHQ } from './provider/movies/flixhq.js';
import { Animepahe } from './provider/anime/animepahe.js';
import { HiMovies } from './provider/movies/himovies.js';
import { Kaido } from './provider/anime/kaido.js';
import { Anizone } from './provider/anime/anizone.js';
import type { IMovieCountry, IMovieGenre } from './types/movies/movie.js';
import type { HIGenre } from './types/anime/zoro.js';
import type { IMetaFormat, Seasons } from './types/meta/meta-anime.js';
import type { IAnimeCategory } from './types/base.js';
import { Aniwatch } from './provider/anime/aniwatch.js';

export {
  Anilist,
  Aniwatch,
  Kaido,
  Animepahe,
  Anizone,
  HiMovies,
  FlixHQ,
  type IMovieCountry,
  type IMovieGenre,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
};
// const data = await new Anilist().fetchAnimepaheProviderEpisodes(269);
// const data = await new Animepahe().fetchEpisodes('1395');
// console.log(data);
