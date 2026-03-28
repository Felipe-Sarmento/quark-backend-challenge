import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RABBITMQ_QUEUES } from '@modules/shared';
import { ClassificationJobPayload } from '@modules/lead';
import { ExtractionService } from '../../core/service/extraction.service';
import { OllamaClient } from '../../http/client/ollama.client';

@Injectable()
export class ExtractionQueueConsumer {
  private readonly logger = new Logger(ExtractionQueueConsumer.name);

  constructor(
    private extractionService: ExtractionService,
    private ollamaClient: OllamaClient,
  ) {}

  @EventPattern(RABBITMQ_QUEUES.CLASSIFICATION_TRIGGER)
  async handleClassificationJob(@Payload() payload: ClassificationJobPayload): Promise<void> {
    this.logger.log(`Processing classification for lead: ${payload.leadId}`);

    try {
      const classification = await this.extractionService.createClassificationRecord(
        payload.leadId,
      );

      const prompt = this.buildClassificationPrompt(payload);
      const response = await this.ollamaClient.classify(prompt);
      const parsedResponse = this.parseOllamaResponse(response);

      await this.extractionService.updateClassificationSuccess(classification.id, {
        score: parsedResponse.score,
        classification: parsedResponse.classification,
        justification: parsedResponse.justification,
        commercialPotential: parsedResponse.commercialPotential,
        modelUsed: 'ollama',
      });

      this.logger.log(`Classification completed for lead: ${payload.leadId}`);
    } catch (error) {
      this.logger.error(`Classification failed for lead: ${payload.leadId}`, error);
      throw error;
    }
  }

  private buildClassificationPrompt(payload: ClassificationJobPayload): string {
    return `
Você é um especialista em prospecção B2B. Analise o seguinte lead e classifique seu potencial comercial.

Nome: ${payload.fullName}
Email: ${payload.email}
Empresa: ${payload.companyName}
CNPJ: ${payload.companyCnpj}
Valor Estimado: ${payload.estimatedValue || 'N/A'}
Notas: ${payload.notes || 'Nenhuma'}

Por favor, forneça uma resposta JSON com a seguinte estrutura:
{
  "score": <0-100>,
  "classification": "<HOT|WARM|COLD>",
  "justification": "<breve explicação>",
  "commercialPotential": "<HIGH|MEDIUM|LOW>"
}
    `.trim();
  }

  private parseOllamaResponse(response: string): {
    score: number;
    classification: string;
    justification: string;
    commercialPotential: string;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score ?? 50,
        classification: parsed.classification ?? 'WARM',
        justification: parsed.justification ?? 'Unable to generate justification',
        commercialPotential: parsed.commercialPotential ?? 'MEDIUM',
      };
    } catch (error) {
      this.logger.warn('Failed to parse Ollama response, using defaults', error);
      return {
        score: 50,
        classification: 'WARM',
        justification: 'Could not parse response',
        commercialPotential: 'MEDIUM',
      };
    }
  }
}
