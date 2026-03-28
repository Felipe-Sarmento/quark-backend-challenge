import { Lead, LeadStatus, LeadSource } from '../../core/entity/lead.entity';

export class LeadResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyCnpj: string;
  companyWebsite?: string;
  estimatedValue?: number;
  source: LeadSource;
  notes?: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(lead: Lead) {
    this.id = lead.id;
    this.fullName = lead.fullName;
    this.email = lead.email;
    this.phone = lead.phone;
    this.companyName = lead.companyName;
    this.companyCnpj = lead.companyCnpj;
    this.companyWebsite = lead.companyWebsite;
    this.estimatedValue = lead.estimatedValue;
    this.source = lead.source;
    this.notes = lead.notes;
    this.status = lead.status;
    this.createdAt = lead.createdAt;
    this.updatedAt = lead.updatedAt;
  }
}
