export enum EnrichmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface IEnrichment {
  id: string;
  leadId: string;
  status: EnrichmentStatus;
  requestedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  enrichmentData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Enrichment implements IEnrichment {
  id: string;
  leadId: string;
  status: EnrichmentStatus;
  requestedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  enrichmentData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IEnrichment) {
    Object.assign(this, data);
  }
}
