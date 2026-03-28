import { Entity } from '@quark/shared';
import { LeadEntityFields } from './types';

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

export class Lead extends Entity {
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

  constructor(data: LeadEntityFields) {
    super({ id: data.id, createdAt: data.createdAt, updatedAt: data.updatedAt });
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
  }
}
