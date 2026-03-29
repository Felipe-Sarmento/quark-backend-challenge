export class CreateLeadResponse {
  message = 'Request processed successfully';

  static create(): CreateLeadResponse  {
    return new CreateLeadResponse();
  }
}
