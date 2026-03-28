import { Module } from '@nestjs/common';
import { AppConfigModule } from '@modules/shared';
import { MockApiModule } from '@modules/mock-api';

@Module({
  imports: [AppConfigModule, MockApiModule],
})
export class MockApiAppModule {}
