

// const flixhq = new FlixHQ();
// const data = await flixhq.fetchMediaInfo('tv-watch-the-boys-33895');
// const data = await flixhq.fetchMediaInfo('movie-watch-bad-boys-ride-or-die-109831');
// const data = await flixhq.fetchMediaServers('movie-109831');
// const data = await flixhq.fetchSources('episode-1019968');
// console.log(JSON.stringify(data.data?.sources));




// const hianime = new HiAnime();
// const data = await hianime.fetchSources('solo-leveling-18718-episode-119497', HiAnimeServers.HD2, SubOrDub.DUB);

// console.log(JSON.stringify(data));
// console.log(data.data?.sources);



Hianime
1. build out airing schedule.
2. Filters for search(new method advanced search)
3. Add watch together


Animekai
1. Fix the episodes
2. fix servers and sources
3. add watch together
4. schedule


FlixHq 
1. Scrape new sections to match himovies

Tmdb 
1. Since mapping flixhq isnt accurate  ill temporarily remove it until a solution is implemented
2. Mapping will be filtered by type then ill need more parameters 

New Sites
1. Kickass anime
5. Check the animekai related movie sites  https://yflix.to/home and https://movhub.ws/home
6. https://www.primewire.mov/
7. https://projectfreetv.sx/
8. https://www.downloads-anymovies.co/
https://rentry.co/sflix#yflix-clones


Critical 
Refactor genres for hianime and animekai

TESTS
1. add tests for himovies 
2. update tests for animekai and flixhq
3. add tests for all anime and animepahe


/// Normalize them first 
1. everything to lowercase before accepting inputs