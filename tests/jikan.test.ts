import { test, expect } from 'vitest';
import { AnimeProvider, Seasons } from '../src/types/types.js';
import { Jikan } from '../src/provider/index.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_MS = 800;

const jikan = new Jikan();

test('returns an array of anime releated to query', async () => {
  const data = await jikan.search('one piece');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('return an array of  upcoming anime', async () => {
  const data = await jikan.fetchTopUpcoming(1, 25);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an array of  airing anime', async () => {
  const data = await jikan.fetchTopAiring(1, 25);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an array of most popular anime', async () => {
  const data = await jikan.fetchMostPopular(1, 20, 'MOVIE', 'airing');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('return an array of  top anime movies category', async () => {
  const data = await jikan.fetchTopMovies(1, 20, 'bypopularity', 'OVA');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('return an array of anime by season', async () => {
  const data = await jikan.fetchSeason(Seasons.FALL, 2022, 'MOVIE');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an array of upcoming season anime', async () => {
  const data = await jikan.fetchNextSeason();
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('return an object containing anime info', async () => {
  const data = await jikan.fetchInfo(56784);
  expect(data.data).not.toBeNull();
  await wait(RATE_LIMIT_MS);
});

test('returns an array of  episodes', async () => {
  const data = await jikan.fetchEpisodes(56784);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an object containing detailed episode info', async () => {
  const data = await jikan.fetchEpisodeInfo(58567, 3);
  expect(data.data).not.toBeNull();
  await wait(RATE_LIMIT_MS);
});

test('returns an object containing provider anime ID with animeinfo', async () => {
  const data = await jikan.fetchProviderAnimeId(52299, AnimeProvider.HiAnime);
  expect(data.data).not.toBeNull();
  expect(data.animeProvider).not.toBeNull();
  await wait(RATE_LIMIT_MS);
});

test('returns an array of the current season anime', async () => {
  const data = await jikan.fetchCurrentSeason(1, 20);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an object containing  AnimeProvider episodes and animeinfo', async () => {
  const data = await jikan.fetchAnimeProviderEpisodes(52299, AnimeProvider.HiAnime);
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an array anime characters', async () => {
  const data = await jikan.fetchAnimeCharacters(56784);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});
