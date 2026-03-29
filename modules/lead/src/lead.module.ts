import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PrismaModule, AppConfigModule, RABBITMQ_QUEUES } from '@modules/shared';
import { LeadService } from './core/service/lead.service';
import { LeadPrismaRepository } from './persistence/lead.prisma.repository';
import {
  ILeadRepository,
} from './core/interface/lead.repository.interface';
import { EnrichmentJobQueueProducer } from './queue/producer/enrichment-job.queue-producer';
import { ClassificationJobQueueProducer } from './queue/producer/classification-job.queue-producer';
import { LeadController } from './http/controller/lead.controller';
import { LeadPublicApi } from './integration/interface/lead.public-api.interface';
import { LeadPublicApiModuleProvider } from './integration/provider/lead.public-api.module.provider';

@Module({
  imports: [
    PrismaModule,
    AppConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'ENRICHMENT_SERVICE',
        imports: [AppConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: RABBITMQ_QUEUES.ENRICHMENT_WORKER_QUEUE,
            queueOptions: { durable: true },
            persistent: true,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'CLASSIFICATION_SERVICE',
        imports: [AppConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: RABBITMQ_QUEUES.CLASSIFICATION_WORKER_QUEUE,
            queueOptions: { durable: true },
            persistent: true,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [LeadController],
  providers: [
    {
      provide: ILeadRepository,
      useClass: LeadPrismaRepository,
    },
    LeadService,
    EnrichmentJobQueueProducer,
    ClassificationJobQueueProducer,
    LeadPublicApiModuleProvider,
    {
      provide: LeadPublicApi,
      useClass: LeadPublicApiModuleProvider,
    },
  ],
  exports: [LeadService, EnrichmentJobQueueProducer, ClassificationJobQueueProducer, LeadPublicApi],
})
export class LeadModule {}
