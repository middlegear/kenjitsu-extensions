import { test, expect } from 'vitest';
import { HiMovies } from '../src/provider/movies/himovies';

const himovies = new HiMovies();
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('returns an array of objects containing media related to search query', async () => {
  const data = await himovies.search('bad-boys', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('returns an array of objects related to suggestions query', async () => {
  const data = await himovies.searchSuggestions('bad-boys');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('retuns an object containing media info with provider episodes', async () => {
  const data = await himovies.fetchMediaInfo('movie-bad-boys-ii-17900');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.providerEpisodes)).toBe(true);

  expect(data.recommended.length).toBeGreaterThan(0);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);

  await wait(1000);
});

test('retuns an object containing home info media', async () => {
  const data = await himovies.fetchHome();
  expect(Array.isArray(data.trending.Movies)).toBe(true);
  expect(Array.isArray(data.trending.Tv)).toBe(true);
  expect(Array.isArray(data.recentReleases.Movies)).toBe(true);
  expect(Array.isArray(data.recentReleases.Tv)).toBe(true);
  expect(Array.isArray(data.upcoming)).toBe(true);

  await wait(1000);
});

test('returns an array of objects containing mostpopular tv', async () => {
  const data = await himovies.fetchPopularTv(1);
  expect(Array.isArray(data.data)).toBe(true);

  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('returns an array of objects containing mostpopular movies', async () => {
  const data = await himovies.fetchPopularMovies(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('returns an array of objects containing top movies', async () => {
  const data = await himovies.fetchTopMovies(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('returns an array of objects containing top tv', async () => {
  const data = await himovies.fetchTopTv(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('returns an array of objects containing  upcoming media', async () => {
  const data = await himovies.fetchTopTv(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('returns an array of objects containing media by country', async () => {
  const data = await himovies.fetchByCountry('UnitedStates', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('returns an array of objects containing media by genre', async () => {
  const data = await himovies.fetchGenre('Action', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('return an array containing object of available servers for a specific movie', async () => {
  const data = await himovies.fetchServers('movie-bad-boys-18997');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);

  await wait(1000);
});

test('return an array containing object of available servers for a specific tv', async () => {
  const data = await himovies.fetchServers('tv-the-boys-33895-episode-1096681');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);

  await wait(1000);
});

test('returns an object containing streaming sources for movie', async () => {
  const data = await himovies.fetchSources('movie-bad-boys-18997', 'akcloud');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);

  await wait(1000);
});

test('returns an object containing streaming sources for tv', async () => {
  const data = await himovies.fetchSources('tv-the-boys-33895-episode-1096681', 'megacloud');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);

  await wait(2000);
});
