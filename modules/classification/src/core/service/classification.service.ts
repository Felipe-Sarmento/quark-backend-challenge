import { Inject, Injectable } from '@nestjs/common';
import { Classification } from '@modules/lead';
import {
  IClassificationRepository,
} from '../interface/classification.repository.interface';

@Injectable()
export class ClassificationService {
  constructor(
    @Inject(IClassificationRepository)
    private repo: IClassificationRepository,
  ) {}

  async createRecord(leadId: string): Promise<Classification> {
    return this.repo.create(leadId);
  }

  async updateSuccess(
    id: string,
    classificationData: {
      score: number;
      classification: string;
      justification: string;
      commercialPotential: string;
      modelUsed?: string;
    },
  ): Promise<Classification> {
    return this.repo.updateSuccess(id, classificationData);
  }

  async updateError(id: string, errorMessage: string): Promise<Classification> {
    return this.repo.updateError(id, errorMessage);
  }

  async getLatestByLeadId(leadId: string): Promise<Classification | null> {
    return this.repo.findLatestByLeadId(leadId);
  }

  async listByLeadId(leadId: string): Promise<Classification[]> {
    return this.repo.listByLeadId(leadId);
  }
}
