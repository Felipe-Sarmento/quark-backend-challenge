import { InternalException } from '@modules/shared';

export class LeadAlreadyExistsException extends InternalException {
  constructor() {
    super('Lead already exists', 409);
  }
}
