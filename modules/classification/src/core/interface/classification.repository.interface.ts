import { Classification } from '@modules/lead';

export interface IClassificationRepository {
  create(leadId: string): Promise<Classification>;
  updateSuccess(
    id: string,
    classificationData: {
      score: number;
      classification: string;
      justification: string;
      commercialPotential: string;
      modelUsed?: string;
    },
  ): Promise<Classification>;
  updateError(id: string, errorMessage: string): Promise<Classification>;
  findLatestByLeadId(leadId: string): Promise<Classification | null>;
  listByLeadId(leadId: string): Promise<Classification[]>;
}

export const IClassificationRepository = Symbol('IClassificationRepository');
