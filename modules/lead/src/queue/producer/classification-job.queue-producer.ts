import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_QUEUES } from '@modules/shared';

export interface ClassificationJobPayload {
  leadId: string;
  fullName: string;
  email: string;
  companyName: string;
  companyCnpj: string;
  estimatedValue?: number;
  notes?: string;
}

@Injectable()
export class ClassificationJobQueueProducer {
  constructor(
    @Inject('RABBITMQ_SERVICE')
    private client: ClientProxy,
  ) {}

  async triggerClassification(payload: ClassificationJobPayload): Promise<void> {
    await this.client.emit(RABBITMQ_QUEUES.CLASSIFICATION_TRIGGER, payload).toPromise();
  }
}
