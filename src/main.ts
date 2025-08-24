import { AnimeKai, FlixHQ, Jikan, Meta, TheMovieDatabase, TvMaze, Anilist } from './provider/index.js';
import { HiAnime } from './provider/anime/hianime/index.js';
import { Anime } from './provider/anime/anime.js';
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
import { getAnilistMapping } from './provider/meta/anizip/index.js';
import {
  _fetchAtoZList,
  _fetchFavourites,
  _fetchMostPopular,
  _fetchRecentlyAdded,
  _fetchRecentlyCompleted,
  _fetchRecentlyUpdated,
  _fetchTopAiring,
} from './provider/anime/hianime/hianime.js';

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

// const zoro = new HiAnime();
// const data = await zoro.fetchSources('solo-leveling-18718-episode-119497', HiAnimeServers.HD2, SubOrDub.DUB);
// console.log(JSON.stringify(data.syncData));

export { Anime, Meta, Anilist, Jikan, HiAnime, AnimeKai, FlixHQ, TheMovieDatabase, TvMaze };
// episode-1019968
// const data = await _fetchAtoZList();
// console.log(data);
