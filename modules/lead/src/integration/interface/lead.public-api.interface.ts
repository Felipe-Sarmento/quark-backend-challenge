import { Lead } from '../../core/entity/lead.entity';

export interface LeadPublicApi {
  getLeadOrThrow(id: string): Promise<Lead>;
}

export const LeadPublicApi = Symbol('LeadPublicApi');
