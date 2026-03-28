import { Module } from '@nestjs/common';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadService } from './core/service/lead.service';
import { EnrichmentJobQueueProducer } from './queue/producer/enrichment-job.queue-producer';
import { ClassificationJobQueueProducer } from './queue/producer/classification-job.queue-producer';
import { LeadController } from './http/controller/lead.controller';

@Module({
  imports: [PrismaModule, RabbitmqModule],
  controllers: [LeadController],
  providers: [LeadService, EnrichmentJobQueueProducer, ClassificationJobQueueProducer],
  exports: [LeadService, EnrichmentJobQueueProducer, ClassificationJobQueueProducer],
})
export class LeadModule {}
