import { Lead } from '../entity/lead.entity';
import { LeadEntityFields } from '../entity/types';

export class LeadFactory {
  static create(data: LeadEntityFields): Lead {
    return new Lead(data);
  }
}
