import { HiAnime } from './provider/anime/hianime.js';
import { AnimeKai, FlixHQ } from './provider/index.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';

import { Seasons, TimeWindow, Format, type AllAnimeSourceResponseMap, type HianimeSourceResponse } from './models/types.js';
// import { AllAnime } from './provider/anime/allanime.js';

export { Seasons, TimeWindow, Format, type HianimeSourceResponse, type AllAnimeSourceResponseMap };

export { Anilist, Jikan, TheMovieDatabase, HiAnime, AnimeKai, FlixHQ };
// const data = await new Anilist().fetchAllAnimeProviderSources('allanime-GoDoALiHc82Jrmcmh-episode-14');

// console.log(data);
