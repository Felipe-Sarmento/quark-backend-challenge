import { Module } from '@nestjs/common';
import { AppConfigModule } from '@modules/shared';
import { EnrichmentQueueModule } from '@modules/enrichment';

@Module({
  imports: [AppConfigModule, EnrichmentQueueModule],
})
export class EnrichmentAppModule {}
