import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/shared';
import { Enrichment, EnrichmentStatus } from '@modules/lead';
import { IEnrichmentRepository } from '../core/interface/enrichment.repository.interface';
import { EnrichmentFactory } from '../core/factory/enrichment.factory';

@Injectable()
export class EnrichmentPrismaRepository implements IEnrichmentRepository {
  constructor(private prisma: PrismaService) {}

  async create(leadId: string): Promise<Enrichment> {
    const enrichment = await this.prisma.enrichment.create({
      data: {
        leadId,
        status: EnrichmentStatus.PROCESSING,
      },
    });

    return EnrichmentFactory.create(enrichment as any);
  }

  async updateSuccess(
    id: string,
    enrichmentData: Record<string, unknown>,
  ): Promise<Enrichment> {
    const enrichment = await this.prisma.enrichment.update({
      where: { id },
      data: {
        status: EnrichmentStatus.SUCCESS,
        completedAt: new Date(),
        enrichmentData: enrichmentData as any,
      },
    });

    return EnrichmentFactory.create(enrichment as any);
  }

  async updateError(id: string, errorMessage: string): Promise<Enrichment> {
    const enrichment = await this.prisma.enrichment.update({
      where: { id },
      data: {
        status: EnrichmentStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      },
    });

    return EnrichmentFactory.create(enrichment as any);
  }

  async findLatestByLeadId(leadId: string): Promise<Enrichment | null> {
    const enrichment = await this.prisma.enrichment.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return enrichment ? EnrichmentFactory.create(enrichment as any) : null;
  }

  async listByLeadId(leadId: string): Promise<Enrichment[]> {
    const enrichments = await this.prisma.enrichment.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return enrichments.map((e) => EnrichmentFactory.create(e as any));
  }
}
