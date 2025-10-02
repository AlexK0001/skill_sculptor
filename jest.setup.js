// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Headers
global.Headers = class Headers extends Map {
  append(name, value) {
    this.set(name, value);
  }
  getSetCookie() {
    return [];
  }
};

// Mock Request
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Headers(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
};

// Mock Response with static json method
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || '';
    this.headers = new Headers(Object.entries(init?.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }
  
  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }
  
  async text() {
    return String(this.body);
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  }
};

// Mock MongoDB
jest.mock('@/lib/mongodb', () => ({
  ObjectId: jest.fn(),
  getDatabase: jest.fn(),
  getUsersCollection: jest.fn(),
  getSkillsCollection: jest.fn(),
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.GOOGLE_API_KEY = 'test-google-api-key';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Suppress console
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};