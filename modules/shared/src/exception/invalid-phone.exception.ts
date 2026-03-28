import { InternalException } from './internal.exception';

export class InvalidPhoneException extends InternalException {
  constructor(value: string) {
    super(`Invalid phone: "${value}"`, 400);
  }
}
