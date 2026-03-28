import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@modules/shared';
import { Lead, LeadStatus, LeadSource } from '../entity/lead.entity';
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
    return this.repo.create(data);
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
    return this.repo.update(id, data);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    return this.repo.updateStatus(id, status);
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
