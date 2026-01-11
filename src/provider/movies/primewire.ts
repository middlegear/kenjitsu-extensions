import { BaseClass } from '../../models/base.js';

export class PrimeWire extends BaseClass {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://primesrc.me') {
    super();
    this.baseUrl = baseUrl;
  }

  async fetchTvServers(tmdbId: number, season: number, episodeNumber: number) {
    try {
      const response = await this.client.get(`${this.baseUrl}/api/v1/s`, {
        params: {
          tmdb: String(tmdbId),
          season: String(season),
          episode: String(episodeNumber),
          type: 'tv',
        },
      });
      return response.data;
    } catch (error) {}
  }

  async fetchMovieServers(tmdbId: number) {
    try {
      const response = await this.client.get(`${this.baseUrl}/api/v1/s`, {
        params: {
          tmdb: String(tmdbId),
          type: 'movie',
        },
      });
      return response.data;
    } catch (error) {}
  }
}
// o()("#searchform, #main-filter").on("submit", function (e) {
//   var t = z(e.target.elements.s.value + "JyjId97F9PVqUPuMO0");
//   o()("<input />").attr("type", "hidden").attr("name", "ds").attr("value", t.slice(0, 10)).appendTo(this);
//   return true;
// }); what of this function

//     This JavaScript snippet is an obfuscated event handler attached to the search form(s) on PrimeWire (likely #searchform and/or #main-filter).
// What it does, step by step:

// It listens for the "submit" event on those forms.
// When the user submits a search (e.g., enters a query in the search box and hits enter/submit):
// It grabs the user's search query from the input field named s: e.target.elements.s.value.
// It concatenates that query with a hardcoded string: "JyjId97F9PVqUPuMO0".
// It passes the combined string to a mysterious function z(...) — this z is likely a custom hashing or encryption function defined elsewhere in the site's heavily obfuscated JavaScript.
// The result t is then sliced to the first 10 characters: t.slice(0, 10).
// It dynamically creates a new <input type="hidden" name="ds" value="those_10_chars"> element.
// It appends this hidden input to the form being submitted.

// Finally, it returns true to allow the form to submit normally.

// Purpose
// This adds a hidden parameter "ds" (probably short for "dynamic salt" or "defense string") to every search request. The value is a short hash/token derived from:

// The user's search term
// A secret constant ("JyjId97F9PVqUPuMO0" — this acts as a salt/key)

// On the server side, PrimeWire likely recomputes the same hash and checks if the provided "ds" matches. If it doesn't, the request is rejected.
// Why this exists
// It's an anti-bot/anti-scraping measure:

// Direct HTTP requests or automated scripts that submit searches without running the site's JavaScript won't include this hidden "ds" field (or will have a wrong value).
// Even if a scraper adds a static "ds", it won't work because the value must change correctly with every different search query.
// It prevents simple curl/wget/fetch-based scraping of search results.

// The code uses obfuscation techniques:

// o() is likely a shorthand for a library like jQuery ($) — o()("<input />") creates a jQuery object for the new input.
// z() is the hidden hashing function (probably something like MD5, SHA, or a custom algo applied to the string).

// This kind of client-side token validation is common on sites like PrimeWire to make automated scraping harder without blocking real browsers.
// In the context of the earlier Kotlin provider code you shared, scrapers would need to either:

// Execute the full page JS to generate this "ds" dynamically, or
// Reverse-engineer the z() function and the salt to compute it themselves.

// That's what this snippet is all about — a small but effective hurdle for bots.
