import { Classification } from '@modules/lead';

export class ClassificationFactory {
  static create(data: any): Classification {
    return new Classification(data);
  }
}
