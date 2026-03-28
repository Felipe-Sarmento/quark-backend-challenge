import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@modules/shared';
import { EnrichmentAppModule } from './enrichment-app.module';

async function bootstrap() {
  const app = await NestFactory.create(EnrichmentAppModule);
  const configService = app.get(ConfigService);

  // Connect as RabbitMQ consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.rabbitmqUrl],
      queue: 'default-queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  Logger.log('Enrichment worker started and listening to RabbitMQ', 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start Enrichment worker', err, 'Bootstrap');
  process.exit(1);
});
