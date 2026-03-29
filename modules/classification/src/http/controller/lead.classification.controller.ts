import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import { LeadPublicApi, ClassificationJobQueueProducer, LeadStatus } from '@modules/lead';
import { ClassificationService } from '../../core/service/classification.service';
import { ClassificationResponse } from '../response/classification.response';

@Controller('leads')
export class LeadClassificationController {
  constructor(
    @Inject(LeadPublicApi) private readonly leadPublicApi: LeadPublicApi,
    private readonly classificationJobQueueProducer: ClassificationJobQueueProducer,
    private readonly classificationService: ClassificationService,
  ) {}

  @Post(':id/classification')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerClassification(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    const lead = await this.leadPublicApi.getLeadOrThrow(id);
    await this.leadPublicApi.changeStatus(id, LeadStatus.CLASSIFYING);
    await this.classificationJobQueueProducer.triggerClassification({
      leadId: id,
      fullName: lead.fullName,
      email: lead.email,
      companyName: lead.companyName,
      companyCnpj: lead.companyCnpj,
      estimatedValue: lead.estimatedValue,
      notes: lead.notes,
    });
    return { message: 'Classification request received' };
  }

  @Get(':id/classifications')
  async listClassifications(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClassificationResponse[]> {
    const classifications = await this.classificationService.listByLeadId(id);
    return classifications.map(ClassificationResponse.fromDomain);
  }
}
