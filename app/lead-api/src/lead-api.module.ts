import { Module } from '@nestjs/common';
import { AppConfigModule, PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadModule } from '@modules/lead';

@Module({
  imports: [AppConfigModule, PrismaModule, RabbitmqModule, LeadModule],
})
export class LeadApiModule {}
