import { Injectable } from '@nestjs/common';
import { Lead, LeadStatus } from '../../core/entity/lead.entity';
import { LeadService } from '../../core/service/lead.service';
import { LeadPublicApi } from '../interface/lead.public-api.interface';

@Injectable()
export class LeadPublicApiModuleProvider implements LeadPublicApi {
  constructor(private readonly leadService: LeadService) {}

  async getLeadOrThrow(id: string): Promise<Lead> {
    return this.leadService.findById(id);
  }

  async changeStatus(id: string, status: LeadStatus): Promise<void> {
    await this.leadService.updateStatus(id, status);
  }
}
