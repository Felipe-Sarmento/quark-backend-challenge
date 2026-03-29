import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_QUEUES } from '@modules/shared';

export interface EnrichmentJobPayload {
  leadId: string;
  retryCount?: number;
}

@Injectable()
export class EnrichmentJobQueueProducer {
  constructor(
    @Inject('ENRICHMENT_SERVICE')
    private client: ClientProxy,
  ) {}

  async triggerEnrichment(payload: EnrichmentJobPayload): Promise<void> {
    await this.client.emit(RABBITMQ_QUEUES.ENRICHMENT_TRIGGER, payload).toPromise();
  }
}
