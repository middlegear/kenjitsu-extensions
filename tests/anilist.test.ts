import { expect, test } from 'vitest';

import { Anilist } from '../src/provider/meta/anilist.js';

const anilist = new Anilist();

test('returns an array of anime related to search query', async () => {
  const data = await anilist.search('bleach', 'ANIME', 1, 20);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array containing airing anime', async () => {
  const data = await anilist.fetchTopAiring(1, 25);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing anime info', async () => {
  const data = await anilist.fetchInfo(21, 'ANIME');
  expect(data.data).not.toBeNull();
});

test('returns an array of related anime', async () => {
  const data = await anilist.fetchRelatedAnime(115230);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of trending anime', async () => {
  const data = await anilist.fetchTrending('ANIME', 'TV');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('retuns an object containing anime cast and characters ', async () => {
  const data = await anilist.fetchCharacters(116674);
  expect(data.data).not.toBeNull();
});

test('returns an array of most popular anime', async () => {
  const data = await anilist.fetchMostPopular('ANIME', 'ONA', 1, 25);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of top rated anime', async () => {
  const data = await anilist.fetchTopRated('ANIME', 'MUSIC', 1, 3);
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

test('returns an object that contains both providerId and anime info for Anizone', async () => {
  const data = await anilist.fetchAnizoneProviderId(169755);
  expect(data.provider).not.toBeNull();
  expect(data.data).not.toBeNull();
});
test('returns an object that contains both providerId and anime info for Animepahe', async () => {
  const data = await anilist.fetchAnimepaheProviderId(169755);
  expect(data.provider).not.toBeNull();
  expect(data.data).not.toBeNull();
});

test('returns an object has anime info and provider episodes array for Anizone', async () => {
  const data = await anilist.fetchAnizoneProviderEpisodes(116674);
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});

test('returns an object has anime info and provider episodes array for Animepahe', async () => {
  const data = await anilist.fetchAnimepaheProviderEpisodes(116674);
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});
