import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { FlixHQ } from './provider/movies/flixhq.js';
import { Animekai } from './provider/anime/animekai.js';
import { Animepahe } from './provider/anime/animepahe.js';
import { HiMovies } from './provider/movies/himovies.js';
import { Kaido } from './provider/anime/kaido.js';
import { Anizone } from './provider/anime/anizone.js';
import { AllAnime } from './provider/anime/allanime.js';
import type { IMovieCountry, IMovieGenre } from './types/movies/movie.js';
import type { HIGenre } from './types/anime/zoro.js';
import type { IMetaFormat, Seasons } from './types/meta/meta-anime.js';
import type { IAnimeCategory } from './types/base.js';

export {
  Anilist,
  Jikan,
  TheMovieDatabase,
  HiAnime,
  Kaido,
  Animekai,
  Animepahe,
  Anizone,
  HiMovies,
  FlixHQ,
  AllAnime,
  type IMovieCountry,
  type IMovieGenre,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
};
// const data = await new Animepahe().fetchSources(
//   'pahe-d2fef1fa-2664-8b45-23b7-dac7a48ee01f-$session$-dab0955a166b65c3a3c3818f8485567a3648d894988a686473e214a477be7f69',
// );
// console.log(data.data);
