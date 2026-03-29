import { Enrichment } from '@modules/lead';

export interface IEnrichmentRepository {
  create(leadId: string): Promise<Enrichment>;
  updateSuccess(
    id: string,
    enrichmentData: Record<string, unknown>,
  ): Promise<Enrichment>;
  updateError(id: string, errorMessage: string): Promise<Enrichment>;
  findLatestByLeadId(leadId: string): Promise<Enrichment | null>;
  listByLeadId(leadId: string): Promise<Enrichment[]>;
}

export const IEnrichmentRepository = Symbol('IEnrichmentRepository');
