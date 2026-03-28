import { Module } from '@nestjs/common';
import { AppConfigModule } from '@modules/shared';
import { ExtractionModule } from '@modules/extraction';

@Module({
  imports: [AppConfigModule, ExtractionModule],
})
export class ExtractionAppModule {}
