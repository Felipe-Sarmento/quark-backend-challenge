import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@modules/shared';
import { Lead, LeadStatus, LeadSource, ILead } from '../entity/lead.entity';
import {
  ILeadRepository,
  ILeadRepository as ILeadRepositoryToken,
} from '../interface/lead.repository.interface';

@Injectable()
export class LeadService {
  constructor(
    @Inject(ILeadRepositoryToken) private repo: ILeadRepository,
  ) {}

  async create(data: {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    companyCnpj: string;
    companyWebsite?: string;
    estimatedValue?: number;
    source: LeadSource;
    notes?: string;
  }): Promise<Lead> {
    const lead = new Lead({
      ...data,
      status: LeadStatus.PENDING,
    } as ILead);
    return this.repo.create(lead);
  }

  async findById(id: string): Promise<Lead | null> {
    return this.repo.findById(id);
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return this.repo.findByEmail(email);
  }

  async list(page: Page): Promise<{ leads: Lead[]; totalItems: number }> {
    return this.repo.list(page);
  }

  async update(
    id: string,
    data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Lead> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Lead with ID ${id} not found`);
    }
    return this.repo.update(Object.assign(existing, data));
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const lead = await this.repo.findById(id);
    if (!lead) {
      throw new Error(`Lead with ID ${id} not found`);
    }
    return this.repo.update(Object.assign(lead, { status }));
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
