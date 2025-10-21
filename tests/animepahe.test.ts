import { test, expect } from 'vitest';
import { Animepahe } from '../src/provider/anime/animepahe.js';

const animepahe = new Animepahe();

test('return an array of search results', async () => {
  const data = await animepahe.search('bleach');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an array of recent updates', async () => {
  const data = await animepahe.fetchRecentlyUpdated(1);

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});
test('return an object containing animeinfo', async () => {
  const data = await animepahe.fetchAnimeInfo('7e7e2276-8adc-3c2d-e655-9df8397d0ee3');
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});

test('return an array of provider episodes', async () => {
  const data = await animepahe.fetchEpisodes('7e7e2276-8adc-3c2d-e655-9df8397d0ee3');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an object containing server info', async () => {
  const data = await animepahe.fetchServers(
    'pahe-7e7e2276-8adc-3c2d-e655-9df8397d0ee3-$session$-5d08385463e07eeabb6e6d1d182ca6ff9619c920089a4dc84fe09718da3fef6a',
  );

  expect(Array.isArray(data.data?.sub)).toBe(true);
  expect(data.data?.sub.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
  expect(data.download).not.toBeNull();
});

test('return an object containing streaming sources', async () => {
  const data = await animepahe.fetchSources(
    'pahe-7e7e2276-8adc-3c2d-e655-9df8397d0ee3-$session$-5d08385463e07eeabb6e6d1d182ca6ff9619c920089a4dc84fe09718da3fef6a',
  );

  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});
