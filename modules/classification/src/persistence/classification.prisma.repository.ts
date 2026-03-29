import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/shared';
import { Classification, ClassificationStatus } from '@modules/lead';
import { IClassificationRepository } from '../core/interface/classification.repository.interface';
import { ClassificationFactory } from '../core/factory/classification.factory';

@Injectable()
export class ClassificationPrismaRepository implements IClassificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(leadId: string): Promise<Classification> {
    const classification = await this.prisma.classification.create({
      data: {
        leadId,
        status: ClassificationStatus.PROCESSING,
      },
    });

    return ClassificationFactory.create(classification as any);
  }

  async updateSuccess(
    id: string,
    classificationData: {
      score: number;
      classification: string;
      justification: string;
      commercialPotential: string;
      modelUsed?: string;
    },
  ): Promise<Classification> {
    const classification = await this.prisma.classification.update({
      where: { id },
      data: {
        status: ClassificationStatus.SUCCESS,
        completedAt: new Date(),
        score: classificationData.score,
        classification: classificationData.classification,
        justification: classificationData.justification,
        commercialPotential: classificationData.commercialPotential,
        modelUsed: classificationData.modelUsed,
      },
    });

    return ClassificationFactory.create(classification as any);
  }

  async updateError(id: string, errorMessage: string): Promise<Classification> {
    const classification = await this.prisma.classification.update({
      where: { id },
      data: {
        status: ClassificationStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      },
    });

    return ClassificationFactory.create(classification as any);
  }

  async findLatestByLeadId(leadId: string): Promise<Classification | null> {
    const classification = await this.prisma.classification.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return classification ? ClassificationFactory.create(classification as any) : null;
  }

  async listByLeadId(leadId: string): Promise<Classification[]> {
    const classifications = await this.prisma.classification.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return classifications.map((c) => ClassificationFactory.create(c as any));
  }
}
