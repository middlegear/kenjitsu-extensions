import { test, expect } from 'vitest';
import { Jikan } from '../src/provider/meta/jikan.js';

const jikan = new Jikan({
  rateLimit: {
    intervalMs: 1200,
    requestsPerInterval: 1,
  },
});

test('returns an array of anime releated to query', async () => {
  const data = await jikan.search('one piece');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an array of  upcoming anime', async () => {
  const data = await jikan.fetchTopUpcoming(1, 25);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of  airing anime', async () => {
  const data = await jikan.fetchTopAiring(1, 25);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of most popular anime', async () => {
  const data = await jikan.fetchMostPopular(1, 20, 'MOVIE', 'airing');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an array of anime by season', async () => {
  const data = await jikan.fetchSeasonalAnime('FALL', 2022, 'MOVIE');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of upcoming season anime', async () => {
  const data = await jikan.fetchNextSeason();
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an object containing anime info', async () => {
  const data = await jikan.fetchInfo(56784);
  expect(data.data).not.toBeNull();
});

test('returns an array of the current season anime', async () => {
  const data = await jikan.fetchCurrentSeason(1, 20);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array anime characters', async () => {
  const data = await jikan.fetchAnimeCharacters(56784);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});
test('returns an array of most favourites', async () => {
  const data = await jikan.fetchMostFavorite();
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});
test('returns an array of top anime', async () => {
  const data = await jikan.fetchTopAnime();
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});
