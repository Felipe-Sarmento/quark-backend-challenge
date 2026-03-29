import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppConfigModule, PrismaModule, RabbitmqModule } from '@modules/shared';
import { LeadModule } from '@modules/lead';
import { EnrichmentModule } from '@modules/enrichment';
import { ClassificationService } from './core/service/classification.service';
import { OllamaClient } from './http/client/ollama.client';
import { ClassificationPrismaRepository } from './persistence/classification.prisma.repository';
import {
  IClassificationRepository,
} from './core/interface/classification.repository.interface';
import { LeadClassificationController } from './http/controller/lead.classification.controller';

@Module({
  imports: [
    HttpModule,
    AppConfigModule,
    PrismaModule,
    RabbitmqModule,
    LeadModule,
    EnrichmentModule,
  ],
  controllers: [LeadClassificationController],
  providers: [
    ClassificationService,
    OllamaClient,
    ClassificationPrismaRepository,
    {
      provide: IClassificationRepository,
      useClass: ClassificationPrismaRepository,
    },
  ],
  exports: [ClassificationService, OllamaClient],
})
export class ClassificationModule {}
