// Yes, this code **scrapes Nyaa.si** - specifically it uses Nyaa's RSS feed endpoint rather than scraping HTML pages directly.
//
// ## How it scrapes Nyaa:
//
//   ### 1. **RSS Feed Access**
// ```typescript
// private buildURL(query: string, sortBy: string = "seeders"): string {
//     const { baseUrl, category } = this.getProviderSettings()
//     const queryString = `page=rss&q=${encodeURIComponent(query)}&c=${category}&f=0&s=${sortBy}&o=desc`
//     return `${baseUrl}/?${queryString}`
// }
// ```
// - Uses Nyaa's RSS feed: `?page=rss&q=...`
// - This is the official RSS API endpoint, not HTML scraping
// - Parameters control: search query, category, sort order
//
// ### 2. **RSS Parsing**
// ```typescript
// private parseRSSFeed(rssText: string): RawTorrent[] {
//   // Parses XML with regex to extract:
//   // - <title> (torrent name)
//   // - <guid> (link)
//   // - <nyaa:seeders>, <nyaa:leechers>, etc.
//   // - <nyaa:infoHash>
// }
// ```
// - Parses the XML RSS feed
// - Extracts torrent metadata from XML tags
// - Handles both standard RSS tags and Nyaa-specific `<nyaa:*>` tags
//
// ### 3. **Magnet Link Extraction** (HTML fallback)
// ```typescript
// async getTorrentMagnetLink(torrent: AnimeTorrent): Promise<string> {
//   const res = await fetch(torrent.link)
//   const html = res.text()
//   const $ = LoadDoc(html)
//
//   // Scrapes the torrent page for magnet link
//   $("a.card-footer-item, a[href^=\"magnet:\"]").each(...)
// }
// ```
// - **This IS HTML scraping** - fetches the torrent detail page
// - Uses `LoadDoc()` to parse HTML with jQuery-like syntax
// - Extracts magnet links from `<a>` tags with `href^="magnet:"`
//
// ## Scraping Approach Summary
//
// | Action | Method | What it does |
// |--------|--------|--------------|
// | **Search/List** | RSS Feed | Uses official RSS API endpoint - lightweight, structured data |
// | **Get Details** | HTML Scraping | Fetches individual torrent pages to extract magnet links |
//
// ## Why RSS + HTML Scraping?
//
// 1. **RSS for search/list**: More reliable, faster, structured data
// 2. **HTML for magnet links**: Nyaa doesn't include magnet links in RSS, so they scrape the detail page
//
// ## Ethical Considerations
//
// This is a legitimate use case for a media center application:
// - Nyaa's RSS feed is designed for this purpose
// - The code respects rate limiting (no aggressive scraping)
// - Uses public endpoints that Nyaa provides
//
// ## Potential Issues
//
// ```typescript
// // Relies on DOM structure that could change
// $("a.card-footer-item, a[href^=\"magnet:\"]")
//   ```
// - If Nyaa changes their HTML structure, magnet extraction breaks
// - RSS endpoint is more stable (official API)
//
// ## Better Alternative
//
// Some Nyaa instances provide magnet links directly in RSS via custom extensions, but the standard Nyaa RSS doesn't include them, hence the fallback to HTML scraping.