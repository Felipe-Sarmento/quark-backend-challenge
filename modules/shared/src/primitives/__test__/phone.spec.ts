import { describe, it, expect } from 'vitest';
import { Phone } from '../phone';
import { InvalidPhoneException } from '../../exception/invalid-phone.exception';

describe('Phone', () => {
  describe('create with valid phone', () => {
    it('should create phone from raw digits', () => {
      const phone = Phone.create('11999999999');
      expect(phone).toBeDefined();
      expect(phone.toRaw()).toBe('11999999999');
    });

    it('should create phone from formatted string with +55', () => {
      const phone = Phone.create('+5511999999999');
      expect(phone).toBeDefined();
      expect(phone.toRaw()).toBe('5511999999999');
    });

    it('should create phone with spaces and dashes', () => {
      const phone = Phone.create('+55 11 99999-9999');
      expect(phone).toBeDefined();
      expect(phone.toRaw()).toBe('5511999999999');
    });

    it('should support 10-digit phone', () => {
      const phone = Phone.create('1199999999');
      expect(phone.toRaw()).toBe('1199999999');
    });

    it('should support 15-digit phone', () => {
      const phone = Phone.create('551199999999999');
      expect(phone.toRaw()).toBe('551199999999999');
    });
  });

  describe('create with invalid phone', () => {
    it('should throw for too-short phone', () => {
      expect(() => Phone.create('123')).toThrow(InvalidPhoneException);
      expect(() => Phone.create('9')).toThrow(InvalidPhoneException);
    });

    it('should throw for too-long phone', () => {
      expect(() => Phone.create('12345678901234567')).toThrow(
        InvalidPhoneException,
      );
    });

    it('should throw for empty phone', () => {
      expect(() => Phone.create('')).toThrow(InvalidPhoneException);
    });

    it('should throw for phone with only non-digits', () => {
      expect(() => Phone.create('()()')).toThrow(InvalidPhoneException);
    });
  });

  describe('toString', () => {
    it('should return raw value', () => {
      const phone = Phone.create('11999999999');
      expect(phone.toString()).toBe('11999999999');
    });
  });
});
