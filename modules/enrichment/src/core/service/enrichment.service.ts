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

  async createEnrichmentRecord(leadId: string): Promise<Enrichment> {
    return this.repo.create(leadId);
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

  async listByLeadId(leadId: string): Promise<Enrichment[]> {
    return this.repo.listByLeadId(leadId);
  }
}
