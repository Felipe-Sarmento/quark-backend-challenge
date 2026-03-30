import { Lead } from '../entity/lead.entity';
import { Page } from '@modules/shared';
import { LeadStatus } from '../entity/lead.entity';

export interface ILeadRepository {
  create(lead: Lead): Promise<Lead>;

  findById(id: string): Promise<Lead | null>;

  findByEmail(email: string): Promise<Lead | null>;

  list(page: Page): Promise<{ leads: Lead[]; totalItems: number }>;

  update(lead: Lead): Promise<Lead>;

  delete(id: string): Promise<void>;

  exportBatch(options: {
    status?: LeadStatus;
    cursor?: string;
    take: number;
  }): Promise<any[]>;
}

export const ILeadRepository = Symbol('ILeadRepository');
