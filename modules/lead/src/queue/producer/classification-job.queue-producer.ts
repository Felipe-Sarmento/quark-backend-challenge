import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_QUEUES } from '@modules/shared';

export interface ClassificationJobPayload {
  leadId: string;
  idempotencyKey: string;
  retryCount?: number;
}

@Injectable()
export class ClassificationJobQueueProducer {
  constructor(
    @Inject('CLASSIFICATION_SERVICE')
    private client: ClientProxy,
  ) {}

  // TODO: Change Payload
  async triggerClassification(payload: ClassificationJobPayload): Promise<void> {
    await this.client.emit(RABBITMQ_QUEUES.CLASSIFICATION_TRIGGER, payload);
  }
}
