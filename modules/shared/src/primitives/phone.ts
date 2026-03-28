import { InvalidPhoneException } from '../exception/invalid-phone.exception';

export class Phone {
  private readonly value: string; // clean digits only

  private constructor(raw: string) {
    this.value = raw;
    this.validateOrThrow();
  }

  static create(raw: string): Phone {
    return new Phone(raw);
  }

  private validateOrThrow(): void {
    const cleaned = this.stripToDigits(this.value);

    // Must have between 10 and 15 digits (E.164 range)
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new InvalidPhoneException(this.value);
    }

    // Update value with cleaned version
    (this as any).value = cleaned;
  }

  private stripToDigits(input: string): string {
    return input.replace(/\D/g, '');
  }

  toRaw(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}
