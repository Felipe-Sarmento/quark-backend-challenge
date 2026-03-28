import { randomUUID } from 'crypto';
import { Lead, LeadStatus, LeadSource } from '../entity/lead.entity';

export interface LeadCreationFields {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyCnpj: string;
  companyWebsite?: string;
  estimatedValue?: number;
  source: LeadSource;
  notes?: string;
}

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
