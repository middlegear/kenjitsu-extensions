import { HiAnime } from './provider/anime/hianime.js';
import { AnimeKai, FlixHQ } from './provider/index.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';
import { Seasons, TimeWindow, Format } from './models/types.js';
import { AllAnime } from './provider/anime/allanime.js';

// const data = await new AllAnime().fetchSources('allanime-kNJ97oTT5XfjQBtRZ-episode-3');
// console.log(data.filemoon);
// console.log(JSON.stringify(data.filemoon));

export { Anilist, Jikan, TheMovieDatabase, HiAnime, AnimeKai, FlixHQ, Seasons, TimeWindow, Format };
