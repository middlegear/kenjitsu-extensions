import { TheMovieDatabase } from '../src/provider';
import { test, expect } from 'vitest';

const tmdb = new TheMovieDatabase();

test('returns an array of tvshows related to query', async () => {
  const data = await tmdb.searchShows('the rookie');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing tvshows', async () => {
  const data = await tmdb.fetchShowInfo(79744);
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.seasons)).toBe(true);
  expect(data.seasons.length).toBeGreaterThan(0);
});

test('returns an array containing tv show episodes', async () => {
  const data = await tmdb.fetchTvEpisodes(79744, 2);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing tv episode information', async () => {
  const data = await tmdb.fetchEpisodeInfo(79744, 3, 5);
  expect(data.data).not.toBeNull();
});

test('returns an array containing trending tv', async () => {
  const data = await tmdb.fetchTrendingTv('week', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array popular tvshows', async () => {
  const data = await tmdb.fetchPopularTv(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of top shows', async () => {
  const data = await tmdb.fetchTopShows(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of airing tv', async () => {
  const data = await tmdb.fetchAiringTv(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing providerId and tv show info ', async () => {
  const data = await tmdb.fetchTvProviderId(119051);
  expect(Array.isArray(data.providerResult)).toBe(true);
  expect(data.providerResult?.length).toBeGreaterThan(0);
  expect(data.data).not.toBe(null);
});

test('returns an object containing array of tv streaming sources', async () => {
  const data = await tmdb.fetchTvSources(119051);
  expect(data.data).not.toBe(null);
  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
});

test('returns an array containing movie search results', async () => {
  const data = await tmdb.searchMovies('badboys', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing movie info', async () => {
  const data = await tmdb.fetchMovieInfo(38700);
  expect(data.data).not.toBe(null);
});

test('returns an array containing trending movies', async () => {
  const data = await tmdb.fetchTrendingMovies('week', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array popular movies', async () => {
  const data = await tmdb.fetchPopularMovies(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of top movies', async () => {
  const data = await tmdb.fetchTopMovies(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of upcoming movies', async () => {
  const data = await tmdb.fetchUpcomingMovies(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of releasing movies', async () => {
  const data = await tmdb.fetchReleasingMovies(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing providerId and movie info ', async () => {
  const data = await tmdb.fetchMovieProviderId(38700);
  expect(Array.isArray(data.providerResult)).toBe(true);
  expect(data.providerResult?.length).toBeGreaterThan(0);
  expect(data.data).not.toBe(null);
});

test('returns an object containing array of movie streaming sources', async () => {
  const data = await tmdb.fetchMovieSources(38700);
  expect(data.data).not.toBe(null);
  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
});
