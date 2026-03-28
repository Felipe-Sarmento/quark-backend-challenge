import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule, RabbitmqModule } from '@modules/shared';
import { ExtractionService } from './core/service/extraction.service';
import { OllamaClient } from './http/client/ollama.client';
import { ExtractionQueueConsumer } from './queue/consumer/extraction.queue-consumer';

@Module({
  imports: [HttpModule, PrismaModule, RabbitmqModule],
  providers: [ExtractionService, OllamaClient, ExtractionQueueConsumer],
  exports: [ExtractionService, OllamaClient],
})
export class ExtractionModule {}
