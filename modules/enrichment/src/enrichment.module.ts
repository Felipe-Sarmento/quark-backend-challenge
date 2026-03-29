import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentService } from './core/service/enrichment.service';
import { MockApiClient } from './http/client/mock-api.client';
import { EnrichmentQueueConsumer } from './queue/consumer/enrichment.queue-consumer';

@Module({
  imports: [HttpModule, PrismaModule, RabbitmqModule, LeadModule],
  providers: [EnrichmentService, MockApiClient, EnrichmentQueueConsumer],
  exports: [EnrichmentService, MockApiClient],
})
export class EnrichmentModule {}
