export enum ClassificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum CommercialPotential {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ClassificationLevel {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export interface IClassification {
  id: string;
  leadId: string;
  status: ClassificationStatus;
  requestedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  score?: number;
  classification?: string;
  justification?: string;
  commercialPotential?: string;
  modelUsed?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Classification implements IClassification {
  id: string;
  leadId: string;
  status: ClassificationStatus;
  requestedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  score?: number;
  classification?: string;
  justification?: string;
  commercialPotential?: string;
  modelUsed?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IClassification) {
    Object.assign(this, data);
  }
}
