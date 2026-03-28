import { Lead, LeadStatus } from '../entity/lead.entity';
import { Page } from '@modules/shared';

export interface ILeadRepository {
  create(data: {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    companyCnpj: string;
    companyWebsite?: string;
    estimatedValue?: number;
    source: any;
    notes?: string;
  }): Promise<Lead>;

  findById(id: string): Promise<Lead | null>;

  findByEmail(email: string): Promise<Lead | null>;

  list(page: Page): Promise<{ leads: Lead[]; totalItems: number }>;

  update(
    id: string,
    data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Lead>;

  updateStatus(id: string, status: LeadStatus): Promise<Lead>;

  delete(id: string): Promise<void>;
}

export const ILeadRepository = Symbol('ILeadRepository');
