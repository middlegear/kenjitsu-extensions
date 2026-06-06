import { test, expect } from 'vitest';
import { Anikoto } from '../src/provider/anime/anikoto.js';

const anikoto = new Anikoto('https://anikototv.to', {
  rateLimit: {
    intervalMs: 1000,
    concurrency: 1,
  },
});

test('returns an array based on search query', async () => {
  const data = await anikoto.search('bleach', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array based on search suggestions query', async () => {
  const data = await anikoto.searchSuggestions('friere');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('retuns an object containing home page data', async () => {
  const data = await anikoto.fetchHome();
  expect(Array.isArray(data.data)).toBe(true);

  expect(Array.isArray(data.recentlyUpdated)).toBe(true);
  expect(Array.isArray(data.upcoming)).toBe(true);
  expect(Array.isArray(data.sections.recentlyAdded)).toBe(true);
  expect(Array.isArray(data.sections.recentlyCompleted)).toBe(true);
  expect(Array.isArray(data.sections.recentlyReleased)).toBe(true);
});

test('returns an object containing array of mostpopular anime', async () => {
  const data = await anikoto.fetchMostPopular(1);

  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array of top airing anime', async () => {
  const data = await anikoto.fetchReleasing(1);
  expect(Array.isArray(data.data)).toBe(true);

  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing media details and episodes', async () => {
  const data = await anikoto.fetchAnimeInfo('bleach-thousand-year-blood-war-arc-2izxu');
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.providerEpisodes)).toBe(true);
  expect(data.providerEpisodes.length).toBeGreaterThan(0);
});

test('returns an array upcoming anime', async () => {
  const data = await anikoto.fetchUpcoming(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array of recently added anime', async () => {
  const data = await anikoto.fetchRecentlyAdded(1);
  expect(Array.isArray(data.data)).toBe(true);

  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array of recently updated anime', async () => {
  const data = await anikoto.fetchRecentlyUpdated(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing array recently completed anime', async () => {
  const data = await anikoto.fetchRecentlyCompleted(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of AtoZ anime lists', async () => {
  const data = await anikoto.fetchAtoZList('A', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of genre anime', async () => {
  const data = await anikoto.fetchGenre('action', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an array of TV category anime', async () => {
  const data = await anikoto.fetchAnimeCategory('TV', 1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('return an object containing serverInfo', async () => {
  const data = await anikoto.fetchServers(
    'cW5KVU96ei9PQkkwbnFmcHJ5Zi9PNzN2bjA3YjlEZHJQZ2tYdmhvWFowb0hWK0UzOUpZcHkvWW1yQ24wdFdFNVlTd1pmT3pQanBmRUlEN215MHRFK28yTm5lcnVxU2E1ZEthdjRKS1ZGbFRlL0JzUWl6Q2txeHRqN0FHMWhiOWtTb2NSNW80TFBnR01xR1BxSGZ6Sm9RPT0',
  );

  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.dub)).toBe(true);
  expect(Array.isArray(data.data?.sub)).toBe(true);
});

test('returns an object containing streaming sources', async () => {
  const data = await anikoto.fetchSources(
    'MmdqalRxdUQyR3NJS3hwbHo4UTA2ZXhhblB3QlZ6ZUJLNGpQU1I5bXZueTVVSEhwNTR2WWhRb1AzQ09icS9JVkE3OTYzNE52R1c5NU9OUFdET2VEcHBsc2hINVpjTC9IUGZscElKZjJKZzE2eFdHcEpPZVNSOXUyMFpMeFN5cmtpU2JrS1VQMFJTQ1g1SFhIb0NXZGNnPT0',
    'sub',
    'vidstream-2',
  );
  expect(data.data).not.toBeNull();
  expect(Array.isArray(data.data?.sources)).toBe(true);
  expect(data.data?.sources.length).toBeGreaterThan(0);
});
