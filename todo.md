

// const flixhq = new FlixHQ();
// const data = await flixhq.fetchMediaInfo('tv-watch-the-boys-33895');
// const data = await flixhq.fetchMediaInfo('movie-watch-bad-boys-ride-or-die-109831');
// const data = await flixhq.fetchMediaServers('movie-109831');
// const data = await flixhq.fetchSources('episode-1019968');
// console.log(JSON.stringify(data.data?.sources));


// const tmdb = new TheMovieDatabase();
// const data = await tmdb.fetchTvSources(119051, 1, 3);
// const data = await tmdb.fetchMovieSources(38700);
// console.log(data);


// const hianime = new HiAnime();
// const data = await hianime.fetchSources('solo-leveling-18718-episode-119497', HiAnimeServers.HD2, SubOrDub.DUB);

// console.log(JSON.stringify(data));
// console.log(data.data?.sources);


// to do

2. have a unified m3u8 format type 
3. move all types to a folder called types 


Hianime
1. Add search Suggestions
2. Filters for search(new method advanced search)
3. Scrape the genre page
4. Write new tests for all new sections


/// when switching to classes 
1. I can have cheerio methods as private methods (reuse repetitive methods )
2. Move the decryptors into the class extractor(decrypt needs to be public while the other remain private)
3. Refactor parsers after switching to classes(i)