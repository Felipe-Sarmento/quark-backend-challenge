import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@modules/shared';
import { Lead, LeadStatus } from '../entity/lead.entity';
import {
  ILeadRepository,
  ILeadRepository as ILeadRepositoryToken,
} from '../interface/lead.repository.interface';
import { LeadCreationFields, LeadFactory } from '../factory/lead.factory';

@Injectable()
export class LeadService {
  constructor(
    @Inject(ILeadRepositoryToken) private repo: ILeadRepository,
  ) {}

  async create(data: LeadCreationFields): Promise<Lead> {
    const lead = LeadFactory.create(data);
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
    return this.repo.update(Object.assign(existing, data, { updatedAt: new Date() }));
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const lead = await this.repo.findById(id);
    if (!lead) {
      throw new Error(`Lead with ID ${id} not found`);
    }
    return this.repo.update(Object.assign(lead, { status, updatedAt: new Date() }));
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
