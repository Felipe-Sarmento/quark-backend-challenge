export class LeadEnrichmentReceivedResponse {
  readonly message = 'Enrichment request received';

  static create(): LeadEnrichmentReceivedResponse {
    return new LeadEnrichmentReceivedResponse();
  }
}
