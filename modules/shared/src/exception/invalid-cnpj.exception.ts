export class InvalidCnpjException extends Error {
  constructor(value: string) {
    super(`Invalid CNPJ: "${value}"`);
    this.name = 'InvalidCnpjException';
  }
}
