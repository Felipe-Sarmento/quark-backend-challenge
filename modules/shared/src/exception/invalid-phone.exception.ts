export class InvalidPhoneException extends Error {
  constructor(value: string) {
    super(`Invalid phone: "${value}"`);
    this.name = 'InvalidPhoneException';
  }
}
