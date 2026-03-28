import { describe, it, expect } from 'vitest';
import { Cnpj } from '../cnpj';
import { InvalidCnpjException } from '../../exception/invalid-cnpj.exception';

describe('Cnpj', () => {
  describe('create with valid CNPJ', () => {
    it('should create CNPJ from formatted string', () => {
      const cnpj = Cnpj.create('11.222.333/0001-81');
      expect(cnpj).toBeDefined();
      expect(cnpj.toRaw()).toBe('11222333000181');
    });

    it('should create CNPJ from raw digits', () => {
      const cnpj = Cnpj.create('11222333000181');
      expect(cnpj).toBeDefined();
      expect(cnpj.toRaw()).toBe('11222333000181');
    });

    it('should format CNPJ correctly', () => {
      const cnpj = Cnpj.create('11222333000181');
      expect(cnpj.toFormatted()).toBe('11.222.333/0001-81');
    });
  });

  describe('create with invalid CNPJ', () => {
    it('should throw for all-same-digit CNPJ', () => {
      expect(() => Cnpj.create('00000000000000')).toThrow(
        InvalidCnpjException,
      );
      expect(() => Cnpj.create('11111111111111')).toThrow(
        InvalidCnpjException,
      );
    });

    it('should throw for CNPJ with wrong length', () => {
      expect(() => Cnpj.create('123')).toThrow(InvalidCnpjException);
      expect(() => Cnpj.create('123456789012345')).toThrow(
        InvalidCnpjException,
      );
    });

    it('should throw for CNPJ with bad checksum', () => {
      expect(() => Cnpj.create('12345678901234')).toThrow(
        InvalidCnpjException,
      );
    });

    it('should throw for empty CNPJ', () => {
      expect(() => Cnpj.create('')).toThrow(InvalidCnpjException);
    });
  });
});
