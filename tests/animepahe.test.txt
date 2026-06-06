import { test, expect } from 'vitest';
import { Animepahe } from '../src/provider/anime/animepahe.js';

const animepahe = new Animepahe();

test('return an array of search results', async () => {
  const data = await animepahe.search('bleach');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an array of recent updates', async () => {
  const data = await animepahe.fetchRecentEpisodes(1);

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});
let episodeId: string;
test('return an object containing animeinfo', async () => {
  const data = await animepahe.fetchAnimeInfo('4923');

  episodeId = data.providerEpisodes[0].episodeId as string;
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});

test('return an array of provider episodes', async () => {
  const data = await animepahe.fetchEpisodes(5985);

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an object containing server info', async () => {
  const data = await animepahe.fetchServers(episodeId);

  expect(Array.isArray(data.data?.sub)).toBe(true);
  expect(data.data?.sub.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
  expect(data.download).not.toBeNull();
});

test('return an object containing streaming sources', async () => {
  const data = await animepahe.fetchSources(episodeId);

  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});
