import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
import { EnrichmentService } from './core/service/enrichment.service';
import { MockApiClient } from './http/client/mock-api.client';
import { EnrichmentQueueConsumer } from './queue/consumer/enrichment.queue-consumer';

@Module({
  imports: [HttpModule, PrismaModule, RabbitmqModule],
  providers: [EnrichmentService, MockApiClient, EnrichmentQueueConsumer],
  exports: [EnrichmentService, MockApiClient],
})
export class EnrichmentModule {}
