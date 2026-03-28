export class InternalException extends Error {
  constructor(
    message: string,
    public readonly httpCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
