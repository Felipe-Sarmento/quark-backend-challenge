import { Module } from '@nestjs/common';
import { AppConfigModule, PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentModule } from '@modules/enrichment';

@Module({
  imports: [AppConfigModule, PrismaModule, RabbitmqModule, LeadModule, EnrichmentModule],
})
export class LeadApiModule {}
