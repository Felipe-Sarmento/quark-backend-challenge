import { LeadSource } from './lead.entity';

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
