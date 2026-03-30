import { Inject, Injectable } from '@nestjs/common';
import { Enrichment } from '@modules/lead';
import {
  IEnrichmentRepository,
} from '../interface/enrichment.repository.interface';

@Injectable()
export class EnrichmentService {
  constructor(
    @Inject(IEnrichmentRepository)
    private repo: IEnrichmentRepository,
  ) {}

  async createEnrichmentRecord(id: string, leadId: string): Promise<Enrichment> {
    return this.repo.create(id, leadId);
  }

  async updateEnrichmentSuccess(
    id: string,
    enrichmentData: Record<string, unknown>,
  ): Promise<Enrichment> {
    return this.repo.updateSuccess(id, enrichmentData);
  }

  async updateEnrichmentError(id: string, errorMessage: string): Promise<Enrichment> {
    return this.repo.updateError(id, errorMessage);
  }

  async getLatestEnrichment(leadId: string): Promise<Enrichment | null> {
    return this.repo.findLatestByLeadId(leadId);
  }

  async findEnrichmentById(id: string): Promise<Enrichment | null> {
    return this.repo.findById(id);
  }


  async listByLeadId(leadId: string): Promise<Enrichment[]> {
    return this.repo.listByLeadId(leadId);
  }
}
