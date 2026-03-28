export class InvalidPageException extends Error {
  constructor(field: string, value: number, reason: string) {
    super(`Invalid page parameter "${field}=${value}": ${reason}`);
    this.name = 'InvalidPageException';
  }
}
