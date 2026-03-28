import { Injectable } from '@nestjs/common';
import { PrismaService, Page } from '@modules/shared';
import { Lead, LeadStatus } from '../core/entity/lead.entity';
import { ILeadRepository } from '../core/interface/lead.repository.interface';

@Injectable()
export class LeadRepository implements ILeadRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    companyCnpj: string;
    companyWebsite?: string;
    estimatedValue?: number;
    source: any;
    notes?: string;
  }): Promise<Lead> {
    const created = await this.prisma.lead.create({
      data: {
        ...data,
        status: LeadStatus.PENDING,
      },
    });

    return new Lead(created as any);
  }

  async findById(id: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    return lead ? new Lead(lead as any) : null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({ where: { email } });
    return lead ? new Lead(lead as any) : null;
  }

  async list(page: Page): Promise<{ leads: Lead[]; totalItems: number }> {
    const [leads, totalItems] = await Promise.all([
      this.prisma.lead.findMany({
        skip: page.toSkip(),
        take: page.toTake(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count(),
    ]);

    return { leads: leads.map((l) => new Lead(l as any)), totalItems };
  }

  async update(
    id: string,
    data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Lead> {
    const updated = await this.prisma.lead.update({
      where: { id },
      data,
    });

    return new Lead(updated as any);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status },
    });

    return new Lead(updated as any);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lead.delete({ where: { id } });
  }
}
