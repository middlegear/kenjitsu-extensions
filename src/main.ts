import { HiAnime } from './provider/anime/hianime.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { Seasons, TimeWindow, Format } from './models/types.js';
import { FlixHQ } from './provider/movies/flixhq/index.js';
import { Animekai } from './provider/anime/animekai.js';
import { Animepahe } from './provider/anime/animepahe.js';

export { Anilist, Jikan, TheMovieDatabase, HiAnime, Animekai, Animepahe, FlixHQ, Seasons, TimeWindow, Format };
// const data = await new Animepahe().fetchSources(
//   'pahe-4d560dfd-e606-c21e-2eef-e48fd09f8188/09c6022c4e2c941b245b7e4322e6a6b1cb40af03ec9eee0e1890d60183746f84',
// );
// const data = await new Animepahe().fetchEpisodes('4d560dfd-e606-c21e-2eef-e48fd09f8188');

// console.log(data);
// console.log(JSON.stringify(data));
// console.log();
