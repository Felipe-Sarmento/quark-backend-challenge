import { Injectable } from '@nestjs/common';
import { Enrichment, EnrichmentStatus } from '@modules/lead';
import { EnrichmentPublicApi } from '../interface/enrichment.public-api.interface';
import { EnrichmentService } from '../../core/service/enrichment.service';

@Injectable()
export class EnrichmentPublicApiProvider implements EnrichmentPublicApi {
  constructor(private enrichmentService: EnrichmentService) {}

  async getLatestSuccessfulEnrichment(leadId: string): Promise<Enrichment | null> {
    const enrichment = await this.enrichmentService.getLatestEnrichment(leadId);

    if (!enrichment || enrichment.status !== EnrichmentStatus.SUCCESS) {
      return null;
    }

    return enrichment;
  }
}
