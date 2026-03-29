import { Enrichment, EnrichmentStatus } from '@modules/lead';

export class EnrichmentResponse {
  id: string;
  leadId: string;
  status: EnrichmentStatus;
  requestedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  enrichmentData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  constructor(enrichment: Enrichment) {
    this.id = enrichment.id;
    this.leadId = enrichment.leadId;
    this.status = enrichment.status;
    this.requestedAt = enrichment.requestedAt;
    this.completedAt = enrichment.completedAt;
    this.errorMessage = enrichment.errorMessage;
    this.enrichmentData = enrichment.enrichmentData;
    this.createdAt = enrichment.createdAt;
    this.updatedAt = enrichment.updatedAt;
  }

  static fromDomain(enrichment: Enrichment): EnrichmentResponse {
    return new EnrichmentResponse(enrichment);
  }
}
