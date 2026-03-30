import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@modules/shared';
import { Lead, LeadStatus } from '../entity/lead.entity';
import { ILeadRepository } from '../interface/lead.repository.interface';
import { LeadFactory } from '../factory/lead.factory';
import { LeadCreationFields } from '../entity/types';
import { UpdateLeadDto } from '../../http/dto/update.lead.dto';
import { LeadAlreadyExistsException } from '../exception/already-exists.lead.exception';
import { LeadNotFoundException } from '../exception/not-found.lead.exception';

@Injectable()
export class LeadService {
  constructor(
    @Inject(ILeadRepository) private repo: ILeadRepository,
  ) {}

  async create(data: LeadCreationFields): Promise<Lead> {
    const lead = LeadFactory.create({ ...data, status: LeadStatus.PENDING });
    try {
      return await this.repo.create(lead);
    } catch (error) {
      if (error instanceof LeadAlreadyExistsException) throw error;
      throw error;
    }
  }

  async findById(id: string): Promise<Lead> {
    const lead = await this.repo.findById(id);
    if (!lead) {
      throw new LeadNotFoundException(`Lead with ID ${id} not found`);
    }
    return lead;
  }

  async findByEmail(email: string): Promise<Lead> {
    const lead = await this.repo.findByEmail(email);
    if (!lead) {
      throw new LeadNotFoundException(`Lead with email ${email} not found`);
    }
    return lead;
  }

  async list(page: Page): Promise<{ leads: Lead[]; totalItems: number }> {
    return this.repo.list(page);
  }

  async update(id: string, data: UpdateLeadDto): Promise<Lead> {
    return this.repo.update({ id, ...data, updatedAt: new Date() } as Lead);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const lead = await this.findById(id);
    lead.status = status;
    return this.repo.update(lead);
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
