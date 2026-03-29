import { Module } from '@nestjs/common';
import { ClientsModule, Transport, ClientOptions } from '@nestjs/microservices';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { AppConfigModule, RabbitmqModule, RABBITMQ_QUEUES } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentModule } from '@modules/enrichment';
import { ClassificationModule } from '../classification.module';
import { ClassificationQueueConsumer } from './consumer/classification.queue-consumer';

@Module({
  imports: [
    ClassificationModule,
    LeadModule,
    EnrichmentModule,
    AppConfigModule,
    RabbitmqModule,
    ClientsModule.registerAsync([
      {
        name: 'CLASSIFICATION_DLQ_CLIENT',
        imports: [AppConfigModule],
        useFactory: (configService: NestConfigService): ClientOptions => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: RABBITMQ_QUEUES.CLASSIFICATION_DLQ,
            queueOptions: { durable: true },
            persistent: true,
          },
        }),
        inject: [NestConfigService],
      },
    ]),
  ],
  controllers: [ClassificationQueueConsumer],
})
export class ClassificationQueueModule {}
