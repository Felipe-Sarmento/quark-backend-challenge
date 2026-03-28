import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService, HttpExceptionFilter } from '@modules/shared';
import { LeadApiModule } from './lead-api.module';

async function bootstrap() {
  const app = await NestFactory.create(LeadApiModule);
  const configService = app.get(ConfigService);
  const port = configService.leadApiPort;

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  Logger.log(`Lead API running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start Lead API', err, 'Bootstrap');
  process.exit(1);
});
