import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/shared';
import { Classification, ClassificationStatus } from '@modules/lead';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(private prisma: PrismaService) {}

  async createClassificationRecord(leadId: string): Promise<Classification> {
    const classification = await this.prisma.classification.create({
      data: {
        leadId,
        status: ClassificationStatus.PROCESSING,
      },
    });

    return new Classification(classification as any);
  }

  async updateClassificationSuccess(
    id: string,
    data: {
      score: number;
      classification: string;
      justification: string;
      commercialPotential: string;
      modelUsed: string;
    },
  ): Promise<Classification> {
    const classification = await this.prisma.classification.update({
      where: { id },
      data: {
        status: ClassificationStatus.SUCCESS,
        completedAt: new Date(),
        ...data,
      },
    });

    return new Classification(classification as any);
  }

  async updateClassificationError(
    id: string,
    errorMessage: string,
  ): Promise<Classification> {
    const classification = await this.prisma.classification.update({
      where: { id },
      data: {
        status: ClassificationStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      },
    });

    return new Classification(classification as any);
  }

  async getLatestClassification(leadId: string): Promise<Classification | null> {
    const classification = await this.prisma.classification.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return classification ? new Classification(classification as any) : null;
  }
}
