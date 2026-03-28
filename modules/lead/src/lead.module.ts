import { Module } from '@nestjs/common';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadService } from './core/service/lead.service';
import { EnrichmentJobQueueProducer } from './queue/producer/enrichment-job.queue-producer';
import { ClassificationJobQueueProducer } from './queue/producer/classification-job.queue-producer';

@Module({
  imports: [PrismaModule, RabbitmqModule],
  providers: [LeadService, EnrichmentJobQueueProducer, ClassificationJobQueueProducer],
  exports: [LeadService, EnrichmentJobQueueProducer, ClassificationJobQueueProducer],
})
export class LeadModule {}
