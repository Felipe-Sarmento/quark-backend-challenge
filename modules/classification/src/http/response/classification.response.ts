import { Classification, ClassificationStatus } from '@modules/lead';

export class ClassificationResponse {
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

  constructor(classification: Classification) {
    this.id = classification.id;
    this.leadId = classification.leadId;
    this.status = classification.status;
    this.requestedAt = classification.requestedAt;
    this.completedAt = classification.completedAt;
    this.errorMessage = classification.errorMessage;
    this.score = classification.score;
    this.classification = classification.classification;
    this.justification = classification.justification;
    this.commercialPotential = classification.commercialPotential;
    this.modelUsed = classification.modelUsed;
    this.createdAt = classification.createdAt;
    this.updatedAt = classification.updatedAt;
  }

  static fromDomain(classification: Classification): ClassificationResponse {
    return new ClassificationResponse(classification);
  }
}
