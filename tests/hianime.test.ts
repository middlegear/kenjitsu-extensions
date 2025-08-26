import { test, expect } from 'vitest';
import { Anime } from '../src/provider/anime/anime.js';
import { SubOrDub } from '../src/provider/index.js';
import { HiAnimeServers } from '../src/provider/anime/hianime/types.js';

const zoro = new Anime.HiAnime();
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// fetchAnimeInfo('bleach-806')
test('returns an array based on search query', async () => {
  const data = await zoro.search('bleach', 1);

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('retuns an object containing anime info', async () => {
  const data = await zoro.fetchInfo('demon-slayer-kimetsu-no-yaiba-swordsmith-village-arc-18056');

  expect(data.data).not.toBeNull();

  await wait(1000);
});

test('returns an array of episodes', async () => {
  const data = await zoro.fetchEpisodes('demon-slayer-kimetsu-no-yaiba-swordsmith-village-arc-18056');

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  await wait(1000);
});

test('return an object containing serverInfo', async () => {
  const data = await zoro.fetchEpisodeServers('solo-leveling-18718-episode-119497');

  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.dub)).toBe(true);
  expect(Array.isArray(data.data?.sub)).toBe(true);
  await wait(1000);
});

test('returns an object containing streaming sources', async () => {
  const data = await zoro.fetchSources('solo-leveling-18718-episode-119497', HiAnimeServers.HD2, SubOrDub.DUB);

  expect(data.data).not.toBeNull();

  expect(data.data?.sources.length).toBeGreaterThan(0);
  await wait(1000);
});
