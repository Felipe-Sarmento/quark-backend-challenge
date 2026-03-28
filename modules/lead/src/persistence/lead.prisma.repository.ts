import { Injectable } from '@nestjs/common';
import { PrismaService, Page, PrismaErrorCode } from '@modules/shared';
import { LeadFactory } from '../core/factory/lead.factory';
import { ILeadRepository } from '../core/interface/lead.repository.interface';
import { LeadAlreadyExistsException } from '../core/exception/already-exists.lead.exception';
import { LeadNotFoundException } from '../core/exception/not-found.lead.exception';
import { ConflictLeadException } from '../core/exception/conflict.lead.exception';
import { Lead } from '../core/entity/lead.entity';

@Injectable()
export class LeadPrismaRepository implements ILeadRepository {
  constructor(private prisma: PrismaService) {}

  async create(lead: Lead): Promise<Lead> {
    try {
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

      return LeadFactory.create(created as Lead);
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === PrismaErrorCode.UniqueConstraint) {
        throw new LeadAlreadyExistsException();
      }
      throw error;
    }
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
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = lead;
    try {
      const updated = await this.prisma.lead.update({
        where: { id },
        data,
      });

      return LeadFactory.create(updated as any);
    } catch (error: unknown) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } };
      if (prismaError.code === PrismaErrorCode.EntityNotFound) {
        throw new LeadNotFoundException(id);
      }
      if (prismaError.code === PrismaErrorCode.UniqueConstraint) {
        const field = prismaError.meta?.target?.[0] ?? 'field';
        throw new ConflictLeadException(field);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.lead.delete({ where: { id } });
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === PrismaErrorCode.EntityNotFound) {
        throw new LeadNotFoundException(id);
      }
      throw error;
    }
  }
}
