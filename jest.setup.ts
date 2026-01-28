import '@testing-library/jest-dom';

// Polyfill for Web APIs used by Next.js server components
import { TextEncoder, TextDecoder } from 'util';

// Add Web API globals for Next.js API route testing
class MockHeaders {
  private headers: Map<string, string> = new Map();

  constructor(init?: HeadersInit) {
    if (init && typeof init === 'object') {
      if (init instanceof MockHeaders) {
        init.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), String(value));
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), String(value));
        });
      }
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) ?? null;
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  delete(name: string): void {
    this.headers.delete(name.toLowerCase());
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach(callback);
  }

  entries(): IterableIterator<[string, string]> {
    return this.headers.entries();
  }

  keys(): IterableIterator<string> {
    return this.headers.keys();
  }

  values(): IterableIterator<string> {
    return this.headers.values();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.headers.entries();
  }
}

class MockRequest {
  private _url: string;
  public method: string;
  public headers: MockHeaders;
  private _body: string | null;

  constructor(input: string | URL, init?: RequestInit) {
    this._url = typeof input === 'string' ? input : input.toString();
    this.method = init?.method || 'GET';
    this.headers = new MockHeaders(init?.headers as Record<string, string>);
    this._body = init?.body as string || null;
  }

  get url(): string {
    return this._url;
  }

  async json(): Promise<unknown> {
    if (!this._body) throw new Error('No body');
    return JSON.parse(this._body);
  }

  async text(): Promise<string> {
    return this._body || '';
  }
}

class MockResponse {
  public status: number;
  public headers: MockHeaders;
  private _body: string;
  public ok: boolean;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this._body = body as string || '';
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new MockHeaders(init?.headers as Record<string, string>);
  }

  async json(): Promise<unknown> {
    return JSON.parse(this._body);
  }

  async text(): Promise<string> {
    return this._body;
  }

  static json(data: unknown, init?: ResponseInit): MockResponse {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      } as Record<string, string>,
    });
  }
}

// @ts-expect-error - Polyfill for test environment
globalThis.Request = MockRequest;
// @ts-expect-error - Polyfill for test environment
globalThis.Response = MockResponse;
// @ts-expect-error - Polyfill for test environment
globalThis.Headers = MockHeaders;

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  // @ts-expect-error - Polyfill for test environment
  globalThis.TextDecoder = TextDecoder;
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
  getSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
  })),
}));

// Mock next/server for API routes
jest.mock('next/server', () => {
  // Case-insensitive headers implementation
  class CaseInsensitiveHeaders {
    private headers: Map<string, string> = new Map();

    constructor(init?: Record<string, string>) {
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) ?? null;
    }

    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value);
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase());
    }

    delete(name: string): void {
      this.headers.delete(name.toLowerCase());
    }

    forEach(callback: (value: string, key: string) => void): void {
      this.headers.forEach(callback);
    }
  }

  class MockNextRequest {
    public url: string;
    public method: string;
    public headers: CaseInsensitiveHeaders;
    private _body: string | null;
    public nextUrl: URL;

    constructor(input: string | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString();
      this.nextUrl = new URL(this.url);
      this.method = init?.method || 'GET';
      this.headers = new CaseInsensitiveHeaders(init?.headers as Record<string, string>);
      this._body = init?.body as string || null;
    }

    async json(): Promise<unknown> {
      if (!this._body) throw new SyntaxError('Unexpected end of JSON input');
      return JSON.parse(this._body);
    }

    async text(): Promise<string> {
      return this._body || '';
    }
  }

  class MockNextResponse {
    public status: number;
    public headers: CaseInsensitiveHeaders;
    private _body: string;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this._body = body as string || '';
      this.status = init?.status || 200;
      this.headers = new CaseInsensitiveHeaders(init?.headers as Record<string, string>);
    }

    async json(): Promise<unknown> {
      return JSON.parse(this._body);
    }

    async text(): Promise<string> {
      return this._body;
    }

    static json(data: unknown, init?: ResponseInit): MockNextResponse {
      return new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        } as Record<string, string>,
      });
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
