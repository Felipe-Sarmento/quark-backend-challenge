import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppConfigModule, PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentService } from './core/service/enrichment.service';
import { MockApiClient } from './http/client/mock-api.client';
import { EnrichmentPrismaRepository } from './persistence/enrichment.prisma.repository';
import {
  IEnrichmentRepository,
} from './core/interface/enrichment.repository.interface';
import { LeadEnrichmentController } from './http/controller/lead.enrichment.controller';

@Module({
  imports: [HttpModule, AppConfigModule, PrismaModule, RabbitmqModule, LeadModule],
  controllers: [LeadEnrichmentController],
  providers: [
    EnrichmentService,
    MockApiClient,
    EnrichmentPrismaRepository,
    {
      provide: IEnrichmentRepository,
      useClass: EnrichmentPrismaRepository,
    },
  ],
  exports: [EnrichmentService, MockApiClient],
})
export class EnrichmentModule {}
