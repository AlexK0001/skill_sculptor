// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill для Web APIs
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.GOOGLE_API_KEY = 'test-google-api-key';

// Mock Request/Response для Next.js
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body));
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

