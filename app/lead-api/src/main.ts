import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@modules/shared';
import { LeadApiModule } from './lead-api.module';

async function bootstrap() {
  const app = await NestFactory.create(LeadApiModule);
  const configService = app.get(ConfigService);
  const port = configService.leadApiPort;

  await app.listen(port);
  Logger.log(`Lead API running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start Lead API', err, 'Bootstrap');
  process.exit(1);
});
