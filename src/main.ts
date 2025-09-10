import { HiAnime } from './provider/anime/hianime.js';
import { AnimeKai, FlixHQ } from './provider/index.js';
import { Anilist } from './provider/meta/anilist.js';
import { Jikan } from './provider/meta/jikan.js';
import { TheMovieDatabase } from './provider/meta/tmdb.js';

import { Seasons, TimeWindow, Format } from './models/types.js';

import { AllAnime } from './provider/anime/allanime.js';
export { Seasons, TimeWindow, Format };

// export { Anilist, Jikan, TheMovieDatabase, HiAnime, AnimeKai, FlixHQ };
// GoDoALiHc82Jrmcmh bleach latest
//LYKSutL2PaAjYyXWz jjk s2
// 62RyEZ8rhyRQf4XM9 kaiju no 8
const data = await new AllAnime().fetchSources('allanime-62RyEZ8rhyRQf4XM9-episode-1', 'okru');
// const data = await new AllAnime().search('kaiju no 8', 1);
console.log(data);
console.log(JSON.stringify(data));
