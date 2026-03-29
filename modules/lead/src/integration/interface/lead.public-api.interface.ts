import { Lead, LeadStatus } from '../../core/entity/lead.entity';

export interface LeadPublicApi {
  getLeadOrThrow(id: string): Promise<Lead>;
  changeStatus(id: string, status: LeadStatus): Promise<void>;
}

export const LeadPublicApi = Symbol('LeadPublicApi');
