import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { FlixHQ } from './provider/movies/flixhq/index.js';
import { Animekai } from './provider/anime/animekai.js';
import { Animepahe } from './provider/anime/animepahe.js';
import { HiMovies } from './provider/movies/himovies.js';

import {
  type IMovieCountry,
  type IMovieGenre,
  type KaiGenres,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
  type IAnime,
  type IMetaAnime,
  type IMetaMovie,
  type IAnimeInfo,
  type IVideoSource,
  type IMetaMovieInfo,
  type IMovieOrTv,
  type ISubOrDub,
} from './models/types.js';

export {
  Anilist,
  Jikan,
  TheMovieDatabase,
  HiAnime,
  Animekai,
  Animepahe,
  HiMovies,
  FlixHQ,
  type IMovieCountry,
  type IMovieGenre,
  type KaiGenres,
  type HIGenre,
  type IMetaFormat,
  type Seasons,
  type IAnimeCategory,
  type IAnime,
  type IMetaAnime,
  type IMetaMovie,
  type IAnimeInfo,
  type IVideoSource,
  type IMetaMovieInfo,
  type IMovieOrTv,
  type ISubOrDub,
};
// const data = await new HiMovies().advancedSearch('all', 'all', 2025, 'action', 'unitedkingdom');
// const data = await new Animepahe().fetchEpisodes('4d560dfd-e606-c21e-2eef-e48fd09f8188');
// movie-bad-boys-18997
//tv-the-boys-33895-episode-1096681
// console.log(data);
// console.log(JSON.stringify(data));
// console.log();

// const data = await new AllAnime().fetchSources('allanime-GoDoALiHc82Jrmcmh-episode-1');
// console.log(JSON.stringify(data));
