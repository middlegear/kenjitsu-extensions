import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { FlixHQ } from './provider/movies/flixhq.js';
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

// const data = await new Animepahe().fetchSources(
//   'pahe-ab79ccc4-e32b-a265-2f43-3ed58bc67206-$session$-c3e8a00e9aff600eb5230eeb37a16f67e0c60d3cee58f3712ca6469b632b7d49',
//   'dub',
// );
// const data = await new Anilist().fetchAnimeProviderEpisodes(186052, 'animepahe');
// console.log(data);
// console.log(JSON.stringify(data));
// anilist 166442
//mal 60057
// super cube pahe-8e40534e-2aab-0f0c-f732-1201c81058f2-$session$-37aafdbd17416a832f5b25f46a665c4fade7582331bb2023fbaa032b988ac039
// 186052 water magician pahe-ab79ccc4-e32b-a265-2f43-3ed58bc67206-$session$-c3e8a00e9aff600eb5230eeb37a16f67e0c60d3cee58f3712ca6469b632b7d49

// bleach 'pahe-d73ac2e4-cf2f-b467-ad0e-947e647701e3-$session$-be1b0a5f7989124c15bc55173c4fc89bf23565059f3d618ac16e7a2c8a105ce4',
