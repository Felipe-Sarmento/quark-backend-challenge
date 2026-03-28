import { InternalException } from './internal.exception';

export class InvalidPageException extends InternalException {
  constructor(field: string, value: number, reason: string) {
    super(`Invalid page parameter "${field}=${value}": ${reason}`, 400);
  }
}
