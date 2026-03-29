import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { EnrichmentAppModule } from './enrichment-app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EnrichmentAppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL as string],
        queue: 'default-queue',
        queueOptions: { durable: true },
      },
    },
  );

  await app.listen();
  Logger.log('Enrichment worker started and listening to RabbitMQ', 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start Enrichment worker', err, 'Bootstrap');
  process.exit(1);
});
