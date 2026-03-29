import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ClassificationAppModule } from './classification-app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ClassificationAppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL as string],
        queue: 'classification-queue',
        queueOptions: { durable: true },
      },
    },
  );

  await app.listen();
  Logger.log('Classification worker started and listening to RabbitMQ', 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start Classification worker', err, 'Bootstrap');
  process.exit(1);
});
