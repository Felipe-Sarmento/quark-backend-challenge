import { InvalidCnpjException } from '../exception/invalid-cnpj.exception';

export class CnpjVo {
  private readonly value: string; // 14 clean digits

  private constructor(raw: string) {
    this.value = raw;
    this.validateOrThrow();
  }

  static create(raw: string): CnpjVo {
    return new CnpjVo(raw);
  }

  private validateOrThrow(): void {
    const cleaned = this.stripToDigits(this.value);

    // Must have exactly 14 digits
    if (cleaned.length !== 14) {
      throw new InvalidCnpjException(this.value);
    }

    // Cannot be all same digit
    if (/^(\d)\1{13}$/.test(cleaned)) {
      throw new InvalidCnpjException(this.value);
    }

    // Verify checksum digits
    if (!this.isValidChecksum(cleaned)) {
      throw new InvalidCnpjException(this.value);
    }

    // Update value with cleaned version
    (this as any).value = cleaned;
  }

  private stripToDigits(input: string): string {
    return input.replace(/\D/g, '');
  }

  private isValidChecksum(cnpj: string): boolean {
    const digits = cnpj.split('').map(Number);

    // Calculate first check digit
    let sum = 0;
    let multiplier = 5;
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * multiplier;
      multiplier = multiplier === 2 ? 9 : multiplier - 1;
    }
    let remainder = sum % 11;
    const firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;

    // Calculate second check digit
    sum = 0;
    multiplier = 6;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * multiplier;
      multiplier = multiplier === 2 ? 9 : multiplier - 1;
    }
    remainder = sum % 11;
    const secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;

    return (
      digits[12] === firstCheckDigit && digits[13] === secondCheckDigit
    );
  }

  toFormatted(): string {
    const cnpj = this.value;
    return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8, 12)}-${cnpj.substring(12)}`;
  }

  toRaw(): string {
    return this.value;
  }
}
