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

export class Lead {
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

  constructor(data: {
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
  }) {
    this.id = data.id;
    this.fullName = data.fullName;
    this.email = data.email;
    this.phone = data.phone;
    this.companyName = data.companyName;
    this.companyCnpj = data.companyCnpj;
    this.companyWebsite = data.companyWebsite;
    this.estimatedValue = data.estimatedValue;
    this.source = data.source;
    this.notes = data.notes;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
