import { randomUUID } from 'crypto';
import { Lead, LeadStatus } from '../entity/lead.entity';
import { LeadCreationFields } from '../entity/types';

export class LeadFactory {
  static create(data: LeadCreationFields): Lead {
    const now = new Date();

    return new Lead({
      id: randomUUID(),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName,
      companyCnpj: data.companyCnpj,
      companyWebsite: data.companyWebsite,
      estimatedValue: data.estimatedValue,
      source: data.source,
      notes: data.notes,
      status: LeadStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }
}
