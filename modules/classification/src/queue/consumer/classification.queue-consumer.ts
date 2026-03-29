import { Controller, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientProxy } from '@nestjs/microservices';
import {
  RABBITMQ_QUEUES,
  DlqPayload,
  sleep,
} from '@modules/shared';
import { ClassificationJobPayload, LeadPublicApi, LeadStatus } from '@modules/lead';
import { EnrichmentPublicApi } from '@modules/enrichment';
import { ClassificationService } from '../../core/service/classification.service';
import { OllamaClient } from '../../http/client/ollama.client';
import {
  CLASSIFICATION_PROMPT_TEMPLATE,
  ClassificationLeadData,
} from '../../infra/classification-prompt.const';

@Controller()
export class ClassificationQueueConsumer {
  private readonly logger = new Logger(ClassificationQueueConsumer.name);
  private readonly RETRY_DELAYS_MS = [2000, 4000, 16000]; // 3 retries: 2s, 4s, 16s

  constructor(
    private classificationService: ClassificationService,
    private ollamaClient: OllamaClient,
    @Inject(EnrichmentPublicApi) private enrichmentPublicApi: EnrichmentPublicApi,
    @Inject(LeadPublicApi) private leadPublicApi: LeadPublicApi,
    @Inject('CLASSIFICATION_RETRY_CLIENT') private retryClient: ClientProxy,
    @Inject('CLASSIFICATION_DLQ_CLIENT') private dlqClient: ClientProxy,
  ) {}

  @EventPattern(RABBITMQ_QUEUES.CLASSIFICATION_TRIGGER)
  async handleClassificationJob(@Payload() payload: ClassificationJobPayload): Promise<void> {
    const retryCount = payload.retryCount ?? 0;
    const attemptNumber = retryCount + 1;

    this.logger.log(
      `Processing classification for lead: ${payload.leadId} (attempt ${attemptNumber}/${this.RETRY_DELAYS_MS.length + 1})`,
    );

    let recordId: string | null = null;

    try {
      // Create classification record
      const classification = await this.classificationService.createRecord(payload.leadId);
      recordId = classification.id;

      // Get latest successful enrichment
      const enrichment = await this.enrichmentPublicApi.getLatestSuccessfulEnrichment(
        payload.leadId,
      );

      if (!enrichment) {
        throw new Error(
          `No successful enrichment found for lead: ${payload.leadId}`,
        );
      }

      // Build prompt with lead and enrichment data
      const leadData: ClassificationLeadData = {
        fullName: payload.fullName,
        email: payload.email,
        companyName: payload.companyName,
        companyCnpj: payload.companyCnpj,
        estimatedValue: payload.estimatedValue,
        notes: payload.notes,
        enrichmentData: enrichment.enrichmentData || {},
      };

      const prompt = CLASSIFICATION_PROMPT_TEMPLATE(leadData);

      // Call Ollama to classify
      const ollamaResponse = await this.ollamaClient.classify(prompt);

      // Parse response and extract JSON
      const classificationData = this.parseClassificationResponse(ollamaResponse);

      // Update classification with success
      await this.classificationService.updateSuccess(classification.id, {
        score: classificationData.score,
        classification: classificationData.classification,
        justification: classificationData.justification,
        commercialPotential: classificationData.commercialPotential,
        modelUsed: 'tinyllama',
      });

      await this.leadPublicApi.changeStatus(payload.leadId, LeadStatus.CLASSIFIED);
      this.logger.log(`Classification completed for lead: ${payload.leadId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Classification failed for lead: ${payload.leadId} (attempt ${attemptNumber})`,
        error,
      );

      // Update the classification record with error if it was created
      if (recordId !== null) {
        try {
          await this.classificationService.updateError(recordId, errorMessage);
        } catch (updateError) {
          this.logger.warn(
            `Failed to update classification error record ${recordId}`,
            updateError,
          );
        }
      }

      // Retry logic
      if (retryCount < this.RETRY_DELAYS_MS.length) {
        const delayMs = this.RETRY_DELAYS_MS[retryCount];
        this.logger.log(
          `Retrying classification for lead ${payload.leadId}, attempt ${retryCount + 2}/${this.RETRY_DELAYS_MS.length + 1} after ${delayMs}ms`,
        );
        await sleep(delayMs);

        try {
          await this.retryClient
            .emit(RABBITMQ_QUEUES.CLASSIFICATION_TRIGGER, {
              ...payload,
              retryCount: retryCount + 1,
            })
            .toPromise();
        } catch (retryError) {
          this.logger.error(
            `Failed to re-publish classification retry for lead ${payload.leadId}`,
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
            .emit(RABBITMQ_QUEUES.CLASSIFICATION_DLQ, {
              originalPayload: payload,
              retryCount,
              errorMessage,
              failedAt: new Date().toISOString(),
              workerName: 'classification',
            } satisfies DlqPayload<ClassificationJobPayload>)
            .toPromise();
        } catch (dlqError) {
          this.logger.error(
            `Failed to publish classification failure to DLQ for lead ${payload.leadId}`,
            dlqError,
          );
        }
      }
    }
  }

  private parseClassificationResponse(response: string): {
    score: number;
    classification: string;
    justification: string;
    commercialPotential: string;
  } {
    try {
      // Extract JSON from response (in case there's text before/after)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (
        typeof parsed.score !== 'number' ||
        typeof parsed.classification !== 'string' ||
        typeof parsed.justification !== 'string' ||
        typeof parsed.commercialPotential !== 'string'
      ) {
        throw new Error('Invalid classification response structure');
      }

      return {
        score: Math.max(0, Math.min(100, parsed.score)),
        classification: parsed.classification,
        justification: parsed.justification,
        commercialPotential: parsed.commercialPotential,
      };
    } catch (error) {
      this.logger.warn('Failed to parse Ollama response, using fallback', error);
      return {
        score: 50,
        classification: 'WARM',
        justification: 'Padrão - falha ao processar resposta',
        commercialPotential: 'MEDIUM',
      };
    }
  }
}
