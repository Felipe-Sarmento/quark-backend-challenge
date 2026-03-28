import { InternalException } from '@modules/shared';

export class LeadNotFoundException extends InternalException {
  constructor(id: string) {
    super(`Lead with ID "${id}" not found`, 404);
  }
}
