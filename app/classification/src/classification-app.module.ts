import { Module } from '@nestjs/common';
import { AppConfigModule } from '@modules/shared';
import { ClassificationQueueModule } from '@modules/classification';

@Module({
  imports: [AppConfigModule, ClassificationQueueModule],
})
export class ClassificationAppModule {}
