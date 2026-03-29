import { Module } from '@nestjs/common';
import { LeadModule } from '@modules/lead';
import { EnrichmentModule } from '../enrichment.module';
import { EnrichmentQueueConsumer } from './consumer/enrichment.queue-consumer';

@Module({
  imports: [EnrichmentModule, LeadModule],
  controllers: [EnrichmentQueueConsumer],
})
export class EnrichmentQueueModule {}
