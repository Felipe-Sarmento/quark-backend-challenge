export enum LeadStatus {
  PENDING = 'PENDING',
  ENRICHING = 'ENRICHING',
  ENRICHED = 'ENRICHED',
  CLASSIFYING = 'CLASSIFYING',
  CLASSIFIED = 'CLASSIFIED',
  FAILED = 'FAILED',
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  PAID_ADS = 'PAID_ADS',
  ORGANIC = 'ORGANIC',
  OTHER = 'OTHER',
}

export interface ILead {
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
}

export class Lead implements ILead {
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

  constructor(data: ILead) {
    Object.assign(this, data);
  }
}
