export class LeadClassificationReceivedResponse {
  readonly message = 'Classification request received';

  static create(): LeadClassificationReceivedResponse {
    return new LeadClassificationReceivedResponse();
  }
}
