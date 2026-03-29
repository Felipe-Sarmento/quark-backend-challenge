import { Module } from '@nestjs/common';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentModule } from '@modules/enrichment';

@Module({
  imports: [RabbitmqModule, PrismaModule, LeadModule, EnrichmentModule],
})
export class LeadApiModule {}
