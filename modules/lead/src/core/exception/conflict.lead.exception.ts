import { InternalException } from '@modules/shared';

export class ConflictLeadException extends InternalException {
  constructor(field: string) {
    super(`${field} already exists`, 409);
  }
}
