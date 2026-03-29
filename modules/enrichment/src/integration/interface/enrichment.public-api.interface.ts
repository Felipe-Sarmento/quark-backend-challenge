import { Enrichment } from '@modules/lead';

export interface EnrichmentPublicApi {
  getLatestSuccessfulEnrichment(leadId: string): Promise<Enrichment | null>;
}

export const EnrichmentPublicApi = Symbol('EnrichmentPublicApi');
