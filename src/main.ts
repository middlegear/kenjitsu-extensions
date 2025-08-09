import { HiAnime } from './provider/anime/hianime/index.js';
import { TheMovieDatabase } from './provider/index.js';
import { Anilist } from './provider/meta/anilist/index.js';
import {
  AnimeKaiServers,
  Seasons,
  SubOrDub,
  Sort,
  StreamingServers,
  TimeWindow,
  JikanStatus,
  AnilistStatus,
  Format,
  Charactersort,
  HiAnimeServers,
  AnimeProvider,
} from './types/index.js';

export {
  Seasons,
  SubOrDub,
  Sort,
  JikanStatus,
  AnilistStatus,
  Format,
  Charactersort,
  AnimeKaiServers,
  HiAnimeServers,
  TimeWindow,
  StreamingServers,
  AnimeProvider,
};
// const tmdb = new TheMovieDatabase();
// const data = await tmdb.fetchTvSources(119051, 1, 3);
// const data = await tmdb.fetchMovieSources(38700);
// const data = await tmdb.searchShows('gossip');
// console.log(data);
// console.log(data.data);
const zoro = new HiAnime();
// const data = await zoro.fetchSources('solo-leveling-18718-episode-119497', HiAnimeServers.HD3, SubOrDub.DUB);
// console.log(JSON.stringify(data));
// console.log(data);
// const flixhq = new FlixHQ();
// const data = await flixhq.fetchMediaInfo('tv-watch-the-boys-33895');
// const data = await flixhq.fetchMediaInfo('movie-watch-bad-boys-ride-or-die-109831');
// const data = await flixhq.fetchMediaServers('movie-109831');
// const data = await flixhq.fetchSources('episode-1019968');
// console.log(JSON.stringify(data.data?.sources));
// console.log(data);
// export { Anime, Meta, Anilist, Jikan, HiAnime, AnimeKai, FlixHQ, TheMovieDatabase, TvMaze };
const { data } = await zoro.fetchSources('solo-leveling-18718-episode-119497', HiAnimeServers.HD2, SubOrDub.DUB);

console.log(data);
// const anilist = new Anilist();
// const data = await anilist.search('bleach');
// console.log(data);
