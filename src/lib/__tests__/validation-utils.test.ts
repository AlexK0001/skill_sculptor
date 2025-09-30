// src/lib/__tests__/validation-utils.test.ts
import {
  sanitizeString,
  isValidEmail,
  isValidObjectId,
  createSuccessResponse,
  createErrorResponse,
} from '../validation-utils';

describe('Validation Utils', () => {
  describe('sanitizeString', () => {
    test('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeString(input);
      expect(result).toBe('Hello');
    });

    test('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World');
    });

    test('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });

    test('should limit string length', () => {
      const longString = 'a'.repeat(1000);
      const result = sanitizeString(longString, 100);
      expect(result.length).toBe(100);
    });
  });

  describe('isValidEmail', () => {
    test('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('name+tag@company.com')).toBe(true);
    });

    test('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidObjectId', () => {
    test('should accept valid MongoDB ObjectIds', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isValidObjectId('123456789012345678901234')).toBe(true);
    });

    test('should reject invalid ObjectIds', () => {
      expect(isValidObjectId('invalid')).toBe(false);
      expect(isValidObjectId('123')).toBe(false);
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId('zzzzzzzzzzzzzzzzzzzzzzz')).toBe(false);
    });
  });

  describe('Response helpers', () => {
    test('should create success response', () => {
      const data = { user: 'John' };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    test('should create error response', () => {
      const response = createErrorResponse('Not found', 404);

      expect(response.status).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Not found');
    });

    test('should include error code in response', () => {
      const response = createErrorResponse('Validation failed', 400, 'VALIDATION_ERROR');

      const body = JSON.parse(response.body);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });
});