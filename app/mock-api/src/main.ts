import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@modules/shared';
import { MockApiAppModule } from './mock-api-app.module';

async function bootstrap() {
  const app = await NestFactory.create(MockApiAppModule);
  const configService = app.get(ConfigService);
  const port = configService.mockApiPort;

  await app.listen(port);
  Logger.log(`Mock API running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start Mock API', err, 'Bootstrap');
  process.exit(1);
});
