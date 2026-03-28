import { Module } from '@nestjs/common';
import { AppConfigModule } from '@modules/shared';
import { EnrichmentModule } from '@modules/enrichment';

@Module({
  imports: [AppConfigModule, EnrichmentModule],
})
export class EnrichmentAppModule {}
