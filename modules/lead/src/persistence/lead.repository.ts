import { Injectable } from '@nestjs/common';
import { PrismaService, Page } from '@modules/shared';
import { Lead } from '../core/entity/lead.entity';
import { LeadFactory } from '../core/factory/lead.factory';
import { ILeadRepository } from '../core/interface/lead.repository.interface';

@Injectable()
export class LeadRepository implements ILeadRepository {
  constructor(private prisma: PrismaService) {}

  async create(lead: Lead): Promise<Lead> {
    const created = await this.prisma.lead.create({
      data: {
        id: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        companyCnpj: lead.companyCnpj,
        companyWebsite: lead.companyWebsite,
        estimatedValue: lead.estimatedValue,
        source: lead.source,
        notes: lead.notes,
        status: lead.status,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
    });

    return LeadFactory.create(created as any);
  }

  async findById(id: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    return lead ? LeadFactory.create(lead as any) : null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({ where: { email } });
    return lead ? LeadFactory.create(lead as any) : null;
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

    return { leads: leads.map((l) => LeadFactory.create(l as any)), totalItems };
  }

  async update(lead: Lead): Promise<Lead> {
    const { id, createdAt, updatedAt, ...data } = lead;
    const updated = await this.prisma.lead.update({
      where: { id },
      data,
    });

    return LeadFactory.create(updated as any);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lead.delete({ where: { id } });
  }
}
