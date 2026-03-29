import { Module } from '@nestjs/common';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
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
  imports: [PrismaModule, RabbitmqModule],
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
