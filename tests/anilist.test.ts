import { test, expect } from 'vitest';

import { Anilist } from '../src/provider/meta/anilist.js';

const anilist = new Anilist();

test('returns an array of anime related to search query', async () => {
  const data = await anilist.search('bleach', 1, 20);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array containing airing anime', async () => {
  const data = await anilist.fetchTopAiring(1, 25);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing anime info', async () => {
  const data = await anilist.fetchInfo(21);
  expect(data.data).not.toBeNull();
});

test('returns an array of related anime', async () => {
  const data = await anilist.fetchRelatedAnime(115230);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of trending anime', async () => {
  const data = await anilist.fetchTrending();
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object that contains both providerId and animeinfo', async () => {
  const data = await anilist.fetchProviderId(169755);
  expect(data.provider).not.toBeNull();
  expect(data.data).not.toBeNull();
});

test('retuns an object containing anime cast and characters ', async () => {
  const data = await anilist.fetchCharacters(116674);
  expect(data.data).not.toBeNull();
});

test('returns an array of most popular anime', async () => {
  const data = await anilist.fetchMostPopular(1, 25, 'ONA');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of top rated anime', async () => {
  const data = await anilist.fetchTopRatedAnime(1, 3, 'MUSIC');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array containing seasonal anime', async () => {
  const data = await anilist.fetchSeasonalAnime('WINTER', 2025, 1, 10, 'ONA');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of upcoming anime', async () => {
  const data = await anilist.fetchTopUpcoming(1, 10);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object has anime info and provider episodes array', async () => {
  const data = await anilist.fetchAnimeProviderEpisodes(159322);
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});
