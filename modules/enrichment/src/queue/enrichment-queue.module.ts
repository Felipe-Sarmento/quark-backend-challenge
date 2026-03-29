import { Module } from '@nestjs/common';
import { ClientsModule, Transport, ClientOptions } from '@nestjs/microservices';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { AppConfigModule, RABBITMQ_QUEUES } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentModule } from '../enrichment.module';
import { EnrichmentQueueConsumer } from './consumer/enrichment.queue-consumer';

@Module({
  imports: [
    EnrichmentModule,
    LeadModule,
    AppConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'ENRICHMENT_DLQ_CLIENT',
        imports: [AppConfigModule],
        useFactory: (configService: NestConfigService): ClientOptions => {
          return {
            transport: Transport.RMQ,
            options: {
              urls: [configService.get<string>('RABBITMQ_URL')],
              queue: RABBITMQ_QUEUES.ENRICHMENT_DLQ,
              queueOptions: { durable: true },
              persistent: true,
            },
          };
        },
        inject: [NestConfigService],
      },
    ]),
  ],
  controllers: [EnrichmentQueueConsumer],
})
export class EnrichmentQueueModule {}
