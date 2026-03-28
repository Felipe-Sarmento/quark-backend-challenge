import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Page } from '@modules/shared';
import { Lead, LeadStatus } from '../entity/lead.entity';
import {
  ILeadRepository,
  ILeadRepository as ILeadRepositoryToken,
} from '../interface/lead.repository.interface';
import { LeadFactory } from '../factory/lead.factory';
import { LeadCreationFields } from '../entity/types';
import { UpdateLeadDto } from '../../http/dto/update.lead.dto';

@Injectable()
export class LeadService {
  constructor(
    @Inject(ILeadRepositoryToken) private repo: ILeadRepository,
  ) {}

  async create(data: LeadCreationFields): Promise<Lead | null> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      return null;
    }

    const lead = LeadFactory.create({ ...data, status: LeadStatus.PENDING });
    return this.repo.create(lead);
  }

  async findById(id: string): Promise<Lead> {
    const lead = await this.repo.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    return lead;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return this.repo.findByEmail(email);
  }

  async list(page: Page): Promise<{ leads: Lead[]; totalItems: number }> {
    return this.repo.list(page);
  }

  async update(id: string, data: UpdateLeadDto): Promise<Lead> {
    const existing = await this.findById(id);
    return this.repo.update(Object.assign(existing, data, { updatedAt: new Date() }));
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const lead = await this.findById(id);
    return this.repo.update(Object.assign(lead, { status, updatedAt: new Date() }));
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.repo.delete(id);
  }
}
