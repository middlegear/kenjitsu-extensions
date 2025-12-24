import { expect, test } from 'vitest';
import { Anizone } from '../provider/anime/anizone';

const anizone = new Anizone();

test('return an array of search results', async () => {
  const data = await anizone.search('bleach');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an array of recent updates', async () => {
  const data = await anizone.fetchUpdates();

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  expect(Array.isArray(data.recentlyAdded)).toBe(true);
  expect(data.recentlyAdded.length).toBeGreaterThan(0);
});
test('return an object containing animeinfo including providerEpisodes', async () => {
  const data = await anizone.fetchAnimeInfo('bleach-sennen-kessen-hen-soukoku-tan-gwna8xmk');

  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});

test('return an object containing streaming sources', async () => {
  const data = await anizone.fetchSources('bleach-sennen-kessen-hen-soukoku-tan-gwna8xmk-episode-12');

  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
  expect(data.data?.tracks?.length).toBeGreaterThan(0);
  expect(data.data).not.toBeNull();
});
