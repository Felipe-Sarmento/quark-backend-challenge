import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/shared';
import { Lead, LeadStatus, LeadSource } from '../entity/lead.entity';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    companyCnpj: string;
    companyWebsite?: string;
    estimatedValue?: number;
    source: LeadSource;
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

  async list(skip = 0, take = 10): Promise<Lead[]> {
    const leads = await this.prisma.lead.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return leads.map((l) => new Lead(l as any));
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
