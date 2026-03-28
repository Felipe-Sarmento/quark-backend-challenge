import { Lead } from '../entity/lead.entity';
import { Page } from '@modules/shared';

export interface ILeadRepository {
  create(lead: Lead): Promise<Lead>;

  findById(id: string): Promise<Lead | null>;

  findByEmail(email: string): Promise<Lead | null>;

  list(page: Page): Promise<{ leads: Lead[]; totalItems: number }>;

  update(lead: Lead): Promise<Lead>;

  delete(id: string): Promise<void>;
}

export const ILeadRepository = Symbol('ILeadRepository');
