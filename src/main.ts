import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { Seasons, TimeWindow, Format, HIGenres, type AKGenres, JSort, AnimeProvider, ISubOrDub } from './models/types.js';
import { FlixHQ } from './provider/movies/flixhq/index.js';
import { Animekai } from './provider/anime/animekai.js';
import { Animepahe } from './provider/anime/animepahe.js';
import { Himovies } from './provider/himovies.js';

export { Anilist, Jikan, TheMovieDatabase, HiAnime, Animekai, Animepahe, Himovies, FlixHQ, Seasons, TimeWindow, Format };
// const data = await new Himovies().fetchSources('movie-bad-boys-18997', 'akcloud');
// const data = await new Animepahe().fetchEpisodes('4d560dfd-e606-c21e-2eef-e48fd09f8188');
// movie-bad-boys-18997
//tv-the-boys-33895-episode-1096681
// console.log(data);
// console.log(JSON.stringify(data));
// console.log();
