import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RABBITMQ_QUEUES } from '@modules/shared';
import { EnrichmentJobPayload, LeadPublicApi } from '@modules/lead';
import { EnrichmentService } from '../../core/service/enrichment.service';
import { MockApiClient } from '../../http/client/mock-api.client';

@Injectable()
export class EnrichmentQueueConsumer {
  private readonly logger = new Logger(EnrichmentQueueConsumer.name);

  constructor(
    private enrichmentService: EnrichmentService,
    private mockApiClient: MockApiClient,
    @Inject(LeadPublicApi) private leadPublicApi: LeadPublicApi,
  ) {}

  @EventPattern(RABBITMQ_QUEUES.ENRICHMENT_TRIGGER)
  async handleEnrichmentJob(@Payload() payload: EnrichmentJobPayload): Promise<void> {
    this.logger.log(`Processing enrichment for lead: ${payload.leadId}`);

    try {
      const lead = await this.leadPublicApi.getLeadOrThrow(payload.leadId);
      const enrichment = await this.enrichmentService.createEnrichmentRecord(payload.leadId);

      const enrichmentData = await this.mockApiClient.enrichCompany(lead.companyCnpj);

      await this.enrichmentService.updateEnrichmentSuccess(enrichment.id, enrichmentData);
      this.logger.log(`Enrichment completed for lead: ${payload.leadId}`);
    } catch (error) {
      this.logger.error(`Enrichment failed for lead: ${payload.leadId}`, error);
      throw error;
    }
  }
}
