import { FetchClient } from '../config/client.js';

export interface ClientConfig {
  /**
   * Proxy URL to route all requests through.
   *
   * @default undefined
   */
  proxyUrl?: string;

  /**
   * Session token
   * * @default undefined
   */
  token?: string;

  headerGeneratorOptions?: {
    browsers?: Array<{ name: string; minVersion?: number; maxVersion?: number }>;
    devices?: string[];
    locales?: string[];
    operatingSystems?: string[];
  };

  /**
   * Whether to use HTTP/2 protocol
   * @default true
   */
  http2?: boolean;

  /**
   * Request timeout in milliseconds
   * @default 15000 (15 seconds)
   */
  timeout?: number;

  /**
   * Delay between consecutive requests in milliseconds (helps avoid rate limits)
   * @default 400
   */
  delayBetweenRequests?: number;

  /**
   * Number of automatic retries on network/timeout errors
   * @default 2
   */
  retries?: number;
}

/**
 * Base class for all scraping modules.
 * Provides a standardized FetchClient with support for proxies, custom headers,
 * timeouts, and retries to improve scraping reliability.
 */
export abstract class BaseClass {
  protected readonly client: FetchClient;

  /**
   * Creates a new BaseClass instance
   *
   * @param options - Configuration options for the underlying HTTP client
   */
  constructor(options: ClientConfig = {}) {
    const config: ClientConfig = {
      proxyUrl: options.proxyUrl,
      token: options.token,
      headerGeneratorOptions: options.headerGeneratorOptions ?? {
        browsers: [{ name: 'chrome', minVersion: 130, maxVersion: 140 }],
        devices: ['desktop'],
        locales: ['en-US'],
        operatingSystems: ['windows'],
      },
      http2: options.http2 ?? true,
      timeout: options.timeout ?? 15000,
      delayBetweenRequests: options.delayBetweenRequests ?? 400,
      retries: options.retries ?? 2,
    };

    this.client = new FetchClient({
      timeout: config.timeout,
      http2: config.http2,
      proxyUrl: config.proxyUrl,
      token: config.token,
      delayBetweenRequests: config.delayBetweenRequests,
      retries: config.retries,
      headerGeneratorOptions: config.headerGeneratorOptions,
    });
  }

  /**
   * Creates a URL-friendly slug from a string
   * @param text - The text to convert to slug
   * @returns A clean URL slug
   */
  protected createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Normalizes a key for mapping lookups (removes spaces and special characters)
   * @param input - The input string to normalize
   * @returns Normalized lowercase string
   */
  protected normalizeKey(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Gets a mapped value from a mapping object with validation
   * @param input - The input value to map
   * @param mapping - The mapping record (key → value)
   * @returns The mapped value
   * @throws Error if input is not valid
   */
  protected getMappedValue<T extends string, U extends string>(input: T, mapping: Record<string, U>): U {
    const normalized = this.normalizeKey(input);
    if (!(normalized in mapping)) {
      throw new Error(`Invalid: ${input}. Must be one of: ${Object.keys(mapping).join(', ')}`);
    }
    return mapping[normalized];
  }
}
