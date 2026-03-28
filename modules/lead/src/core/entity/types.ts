import { LeadSource, LeadStatus } from './lead.entity';

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

export interface LeadEntityFields extends LeadCreationFields {
  id?: string;
  status: LeadStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
