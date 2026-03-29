import { Module } from '@nestjs/common';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentModule } from '@modules/enrichment';
import { ClassificationModule } from '@modules/classification';

@Module({
  imports: [RabbitmqModule, PrismaModule, LeadModule, EnrichmentModule, ClassificationModule],
})
export class LeadApiModule {}
