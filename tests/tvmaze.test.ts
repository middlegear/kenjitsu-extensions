import { test, expect } from 'vitest';
import { TvMaze } from '../src/provider';

const tvmaze = new TvMaze();

test('returns an array of tvshows related to search results', async () => {
  const data = await tvmaze.search('under the dome');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing tvshow info (imdbId)', async () => {
  const data = await tvmaze.searchbyImDbId('tt13443470');
  expect(data.data).not.toBe(null);
});

test('returns an object containing tvshow info', async () => {
  const data = await tvmaze.fetchInfo(1);
  expect(data.data).not.toBe(null);
  expect(Array.isArray(data.episodes)).toBe(true);
  expect(Array.isArray(data.cast)).toBe(true);
  expect(data.episodes.length).toBeGreaterThan(0);
  expect(data.cast.length).toBeGreaterThan(0);
});

test('returns an array of tv episodes', async () => {
  const data = await tvmaze.fetchEpisodes(1);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
});

test('returns an object containing id from external databases', async () => {
  const data = await tvmaze.fetchExternal(1);
  expect(data.data).not.toBe(null);
});
