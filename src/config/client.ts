import { gotScraping } from 'got-scraping';
import { URLSearchParams } from 'url';

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RequestError extends Error {
  constructor(
    message: string,
    public readonly response: FetchResponse,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  retries?: number;
  timeout?: number;
  delayBetweenRequests?: number;
}

export interface FetchResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  config: RequestConfig;
}

export type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
export type ResponseInterceptor = (response: FetchResponse) => Promise<FetchResponse> | FetchResponse;

export class FetchClient {
  private readonly defaultOptions: {
    timeout: number;
    retries: number;
    delayBetweenRequests: number;
  };
  private lastRequestTime = 0;
  private lastUserAgent: string | null = null;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];

  constructor(options: Partial<RequestConfig> = {}) {
    this.defaultOptions = {
      timeout: options.timeout || 100000,
      retries: options.retries || 2,
      delayBetweenRequests: options.delayBetweenRequests || 0,
    };
  }

  public useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  public getUserAgent(): string | null {
    return this.lastUserAgent;
  }

  private async delayIfNeeded(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const baseDelay = this.defaultOptions.delayBetweenRequests;
    const jitter = Math.floor(Math.random() * 250);
    const waitTime = baseDelay + jitter - elapsed;
    if (waitTime > 0) {
      await new Promise(res => setTimeout(res, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  public async request<T = any>(config: RequestConfig): Promise<FetchResponse<T>> {
    let finalConfig: RequestConfig = { ...this.defaultOptions, ...config };

    await this.delayIfNeeded();

    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    const { url, method = 'GET', headers = {}, body, params } = finalConfig;
    const retries = finalConfig.retries ?? this.defaultOptions.retries;

    const finalUrl = params ? `${url}?${new URLSearchParams(params).toString()}` : url;

    const gotOptions: any = {
      method,
      headers,
      timeout: { request: finalConfig.timeout },
      throwHttpErrors: false,
      hooks: {
        beforeRequest: [
          (options: { headers: { [x: string]: null } }) => {
            this.lastUserAgent = options.headers['user-agent'] || null;
          },
        ],
      },
    };

    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        gotOptions.form = body;
      } else if (body instanceof URLSearchParams) {
        gotOptions.form = body;
      } else if (typeof body === 'object') {
        gotOptions.json = body;
      } else {
        gotOptions.body = String(body);
      }
    }

    try {
      const response = await gotScraping(finalUrl, gotOptions);

      let data: T;
      const contentType = response.headers['content-type'];
      if (contentType?.includes('application/json')) {
        data = JSON.parse(response.body) as T;
      } else {
        data = response.body as T;
      }

      let responseObj: FetchResponse<T> = {
        status: response.statusCode,
        statusText: response.statusMessage || '',
        headers: response.headers as Record<string, string>,
        data,
        config: finalConfig,
      };

      for (const interceptor of this.responseInterceptors) {
        responseObj = await interceptor(responseObj);
      }

      if (response.statusCode >= 400) {
        throw new RequestError(`Request failed with status code ${response.statusCode}`, responseObj);
      }

      return responseObj;
    } catch (error) {
      const isTimeoutError = error instanceof Error && error.name === 'TimeoutError';
      if ((isTimeoutError || error instanceof NetworkError) && retries > 0) {
        return this.request({ ...finalConfig, retries: retries - 1 });
      }

      if (error instanceof RequestError) throw error;

      throw new NetworkError(`Request failed: ${(error as Error).message}`, error as Error);
    }
  }

  public async get<T = any>(url: string, config: Partial<RequestConfig> = {}) {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  public async post<T = any>(url: string, data?: any, config: Partial<RequestConfig> = {}) {
    return this.request<T>({ ...config, url, method: 'POST', body: data });
  }
}

// const res = await gotScraping(mediaUrl, {
//   hooks: {
//     beforeRequest: [
//       options => {
//         userAgentKey = options.headers['user-agent'];
//       },
//     ],
//   },
// });
