import { InternalException } from './internal.exception';

export class InvalidCnpjException extends InternalException {
  constructor(value: string) {
    super(`Invalid CNPJ: "${value}"`, 400);
  }
}
