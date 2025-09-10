import { test, expect } from 'vitest';
import { Jikan } from '../src/provider/meta/jikan.js';

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
  const data = await jikan.fetchTopMovies(1, 20, 'OVA');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('return an array of anime by season', async () => {
  const data = await jikan.fetchSeasonalAnime('FALL', 2022, 'MOVIE');
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

test('returns an object containing provider anime ID with animeinfo for hianime', async () => {
  const data = await jikan.fetchProviderId(52299, 'hianime');
  expect(data.data).not.toBeNull();
  expect(data.provider).not.toBeNull();
  await wait(RATE_LIMIT_MS);
});

test('returns an object containing provider anime ID with animeinfo for allanime', async () => {
  const data = await jikan.fetchProviderId(52299, 'allanime');
  expect(data.data).not.toBeNull();
  expect(data.provider).not.toBeNull();
  await wait(RATE_LIMIT_MS);
});

test('returns an array of the current season anime', async () => {
  const data = await jikan.fetchCurrentSeason(1, 20);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an object containing  AnimeProvider episodes and animeinfo for hianime', async () => {
  const data = await jikan.fetchAnimeProviderEpisodes(52299, 'hianime');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  await wait(RATE_LIMIT_MS);
});

test('returns an object containing  AnimeProvider episodes and animeinfo for allanime', async () => {
  const data = await jikan.fetchAnimeProviderEpisodes(52299, 'allanime');
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

test('returns an object containing streaming sources for allanime provider', async () => {
  const data = await jikan.fetchAllAnimeProviderSources('allanime-GoDoALiHc82Jrmcmh-episode-1, sub');

  expect(data.okru?.data).not.toBeNull();
  expect(data.filemoon?.data).not.toBeNull();
  expect(data.mp4upload?.data).not.toBeNull();
});

test('returns an object containing streaming sources for hianime provider', async () => {
  const data = await jikan.fetchHianimeProviderSources('hianime-solo-leveling-18718-episode-119497', 'sub');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
});
