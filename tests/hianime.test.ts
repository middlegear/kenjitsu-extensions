import { test, expect } from 'vitest';
import { HiAnime } from '../src/provider/anime/hianime.js';

const zoro = new HiAnime();

test('returns an array based on search query', async () => {
  const data = await zoro.search('bleach', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array based on search suggestions query', async () => {
  const data = await zoro.searchSuggestions('jujutsu');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('retuns an object containing anime info', async () => {
  const data = await zoro.fetchAnimeInfo('bleach-806');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.mostPopular)).toBe(true);
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  expect(data.recommendedAnime.length).toBeGreaterThan(0);
  expect(data.promotionVideos.length).toBeGreaterThan(0);
  expect(data.mostPopular.length).toBeGreaterThan(0);
  expect(data.relatedAnime.length).toBeGreaterThan(0);
  expect(data.relatedSeasons.length).toBeGreaterThan(0);
  expect(data.characters.length).toBeGreaterThan(0);
  expect(data.mostPopular.length).toBeGreaterThan(0);
});

test('retuns an object containing home page data', async () => {
  const data = await zoro.fetchHome();
  expect(Array.isArray(data.data)).toBe(true);
  expect(Array.isArray(data.topAiring)).toBe(true);
  expect(Array.isArray(data.recentlyAdded)).toBe(true);
  expect(Array.isArray(data.recentlyCompleted)).toBe(true);
  expect(Array.isArray(data.recentlyUpdated)).toBe(true);
  expect(Array.isArray(data.favourites)).toBe(true);
  expect(Array.isArray(data.trending)).toBe(true);
  expect(Array.isArray(data.mostPopular)).toBe(true);
});

test('returns an object containing array of mostpopular anime and top anime', async () => {
  const data = await zoro.fetchMostPopular(1);
  expect(Array.isArray(data.topAnime.daily)).toBe(true);
  expect(Array.isArray(data.topAnime.weekly)).toBe(true);
  expect(Array.isArray(data.topAnime.monthly)).toBe(true);
  expect(data.topAnime.daily.length).toBeGreaterThan(0);
  expect(data.topAnime.weekly.length).toBeGreaterThan(0);
  expect(data.topAnime.monthly.length).toBeGreaterThan(0);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array of top airing anime and top anime', async () => {
  const data = await zoro.fetchTopAiring(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(Array.isArray(data.topAnime.daily)).toBe(true);
  expect(Array.isArray(data.topAnime.weekly)).toBe(true);
  expect(Array.isArray(data.topAnime.monthly)).toBe(true);
  expect(data.topAnime.daily.length).toBeGreaterThan(0);
  expect(data.topAnime.weekly.length).toBeGreaterThan(0);
  expect(data.topAnime.monthly.length).toBeGreaterThan(0);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array favourite anime and top anime', async () => {
  const data = await zoro.fetchMostFavourites(1);
  expect(Array.isArray(data.topAnime.daily)).toBe(true);
  expect(Array.isArray(data.topAnime.weekly)).toBe(true);
  expect(Array.isArray(data.topAnime.monthly)).toBe(true);
  expect(data.topAnime.daily.length).toBeGreaterThan(0);
  expect(data.topAnime.weekly.length).toBeGreaterThan(0);
  expect(data.topAnime.monthly.length).toBeGreaterThan(0);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array dubbed anime', async () => {
  const data = await zoro.fetchDubbedAnime(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of subbed anime', async () => {
  const data = await zoro.fetchSubbedAnime(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array of recently added anime and top anime', async () => {
  const data = await zoro.fetchRecentlyAdded(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(Array.isArray(data.topAnime.daily)).toBe(true);
  expect(Array.isArray(data.topAnime.weekly)).toBe(true);
  expect(Array.isArray(data.topAnime.monthly)).toBe(true);
  expect(data.topAnime.daily.length).toBeGreaterThan(0);
  expect(data.topAnime.weekly.length).toBeGreaterThan(0);
  expect(data.topAnime.monthly.length).toBeGreaterThan(0);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array of recently updated anime and top anime', async () => {
  const data = await zoro.fetchRecentlyUpdated(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(Array.isArray(data.topAnime.daily)).toBe(true);
  expect(Array.isArray(data.topAnime.weekly)).toBe(true);
  expect(Array.isArray(data.topAnime.monthly)).toBe(true);
  expect(data.topAnime.daily.length).toBeGreaterThan(0);
  expect(data.topAnime.weekly.length).toBeGreaterThan(0);
  expect(data.topAnime.monthly.length).toBeGreaterThan(0);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array recently completed anime and top anime', async () => {
  const data = await zoro.fetchRecentlyCompleted(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(Array.isArray(data.topAnime.daily)).toBe(true);
  expect(Array.isArray(data.topAnime.weekly)).toBe(true);
  expect(Array.isArray(data.topAnime.monthly)).toBe(true);
  expect(data.topAnime.daily.length).toBeGreaterThan(0);
  expect(data.topAnime.weekly.length).toBeGreaterThan(0);
  expect(data.topAnime.monthly.length).toBeGreaterThan(0);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of AtoZ anime lists', async () => {
  const data = await zoro.fetchAtoZList('A', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of genre anime', async () => {
  const data = await zoro.fetchGenre('action', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of TV category anime', async () => {
  const data = await zoro.fetchAnimeCategory('TV', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of episodes', async () => {
  const data = await zoro.fetchEpisodes('demon-slayer-kimetsu-no-yaiba-swordsmith-village-arc-18056');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an object containing serverInfo', async () => {
  const data = await zoro.fetchServers('solo-leveling-18718-episode-119497');

  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.dub)).toBe(true);
  expect(Array.isArray(data.data?.sub)).toBe(true);
});

test('returns an object containing streaming sources', async () => {
  const data = await zoro.fetchSources('solo-leveling-18718-episode-119497', 'hd-2', 'sub');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
});
