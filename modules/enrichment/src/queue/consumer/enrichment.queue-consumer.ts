import { Controller, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientProxy } from '@nestjs/microservices';
import {
  RABBITMQ_QUEUES,
  DlqPayload,
  sleep,
} from '@modules/shared';
import { EnrichmentJobPayload, LeadPublicApi, LeadStatus } from '@modules/lead';
import { EnrichmentService } from '../../core/service/enrichment.service';
import { MockApiClient } from '../../http/client/mock-api.client';

@Controller()
export class EnrichmentQueueConsumer {
  private readonly logger = new Logger(EnrichmentQueueConsumer.name);
  private readonly RETRY_DELAYS_MS = [2000, 4000, 16000]; // 3 retries: 2s, 4s, 16s

  constructor(
    private enrichmentService: EnrichmentService,
    private mockApiClient: MockApiClient,
    @Inject(LeadPublicApi) private leadPublicApi: LeadPublicApi,
    @Inject('RABBITMQ_SERVICE') private retryClient: ClientProxy,
    @Inject('ENRICHMENT_DLQ_CLIENT') private dlqClient: ClientProxy,
  ) {}

  @EventPattern(RABBITMQ_QUEUES.ENRICHMENT_TRIGGER)
  async handleEnrichmentJob(@Payload() payload: EnrichmentJobPayload): Promise<void> {
    const retryCount = payload.retryCount ?? 0;
    const attemptNumber = retryCount + 1;

    this.logger.log(
      `Processing enrichment for lead: ${payload.leadId} (attempt ${attemptNumber}/${this.RETRY_DELAYS_MS.length + 1})`,
    );

    let recordId: string | null = null;

    try {
      const lead = await this.leadPublicApi.getLeadOrThrow(payload.leadId);
      const enrichment = await this.enrichmentService.createEnrichmentRecord(
        payload.leadId,
      );
      recordId = enrichment.id;

      const enrichmentData = await this.mockApiClient.enrichCompany(lead.companyCnpj);

      await this.enrichmentService.updateEnrichmentSuccess(enrichment.id, enrichmentData);
      await this.leadPublicApi.changeStatus(payload.leadId, LeadStatus.ENRICHED);
      this.logger.log(`Enrichment completed for lead: ${payload.leadId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Enrichment failed for lead: ${payload.leadId} (attempt ${attemptNumber})`,
        error,
      );

      // Update the enrichment record with error if it was created
      if (recordId !== null) {
        try {
          await this.enrichmentService.updateEnrichmentError(recordId, errorMessage);
        } catch (updateError) {
          this.logger.warn(
            `Failed to update enrichment error record ${recordId}`,
            updateError,
          );
        }
      }

      // Retry logic
      if (retryCount < this.RETRY_DELAYS_MS.length) {
        const delayMs = this.RETRY_DELAYS_MS[retryCount];
        this.logger.log(
          `Retrying enrichment for lead ${payload.leadId}, attempt ${retryCount + 2}/${this.RETRY_DELAYS_MS.length + 1} after ${delayMs}ms`,
        );
        await sleep(delayMs);

        try {
          await this.retryClient
            .emit(RABBITMQ_QUEUES.ENRICHMENT_TRIGGER, {
              ...payload,
              retryCount: retryCount + 1,
            })
            .toPromise();
        } catch (retryError) {
          this.logger.error(
            `Failed to re-publish enrichment retry for lead ${payload.leadId}`,
            retryError,
          );
        }
      } else {
        // Max retries exhausted - set lead to FAILED and publish to DLQ
        this.logger.error(
          `Max retries (${this.RETRY_DELAYS_MS.length}) reached for lead ${payload.leadId}, sending to DLQ`,
        );

        try {
          await this.leadPublicApi.changeStatus(payload.leadId, LeadStatus.FAILED);
        } catch (statusError) {
          this.logger.warn(
            `Failed to set lead status to FAILED for lead ${payload.leadId}`,
            statusError,
          );
        }

        try {
          await this.dlqClient
            .emit(RABBITMQ_QUEUES.ENRICHMENT_DLQ, {
              originalPayload: payload,
              retryCount,
              errorMessage,
              failedAt: new Date().toISOString(),
              workerName: 'enrichment',
            } satisfies DlqPayload<EnrichmentJobPayload>)
            .toPromise();
        } catch (dlqError) {
          this.logger.error(
            `Failed to publish enrichment failure to DLQ for lead ${payload.leadId}`,
            dlqError,
          );
        }
      }
    }
  }
}
