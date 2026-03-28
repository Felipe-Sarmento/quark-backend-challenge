import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/shared';
import { Enrichment, EnrichmentStatus } from '@modules/lead';

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(private prisma: PrismaService) {}

  async createEnrichmentRecord(leadId: string): Promise<Enrichment> {
    const enrichment = await this.prisma.enrichment.create({
      data: {
        leadId,
        status: EnrichmentStatus.PROCESSING,
      },
    });

    return new Enrichment(enrichment as any);
  }

  async updateEnrichmentSuccess(
    id: string,
    enrichmentData: Record<string, unknown>,
  ): Promise<Enrichment> {
    const enrichment = await this.prisma.enrichment.update({
      where: { id },
      data: {
        status: EnrichmentStatus.SUCCESS,
        completedAt: new Date(),
        enrichmentData,
      },
    });

    return new Enrichment(enrichment as any);
  }

  async updateEnrichmentError(id: string, errorMessage: string): Promise<Enrichment> {
    const enrichment = await this.prisma.enrichment.update({
      where: { id },
      data: {
        status: EnrichmentStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      },
    });

    return new Enrichment(enrichment as any);
  }

  async getLatestEnrichment(leadId: string): Promise<Enrichment | null> {
    const enrichment = await this.prisma.enrichment.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return enrichment ? new Enrichment(enrichment as any) : null;
  }
}
