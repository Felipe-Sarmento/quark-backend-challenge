import { Enrichment } from '@modules/lead';

export class EnrichmentFactory {
  static create(data: any): Enrichment {
    return new Enrichment(data);
  }
}
