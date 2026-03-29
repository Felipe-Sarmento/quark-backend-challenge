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
import { LeadPublicApi, LeadEnrichmentReceivedResponse, EnrichmentJobQueueProducer } from '@modules/lead';
import { EnrichmentService } from '../../core/service/enrichment.service';
import { EnrichmentResponse } from '../response/enrichment.response';

@Controller('leads')
export class LeadEnrichmentController {
  constructor(
    @Inject(LeadPublicApi) private readonly leadPublicApi: LeadPublicApi,
    private readonly enrichmentJobQueueProducer: EnrichmentJobQueueProducer,
    private readonly enrichmentService: EnrichmentService,
  ) {}

  @Post(':id/enrichment')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerEnrichment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LeadEnrichmentReceivedResponse> {
    await this.leadPublicApi.getLeadOrThrow(id);
    await this.enrichmentJobQueueProducer.triggerEnrichment({ leadId: id });
    return LeadEnrichmentReceivedResponse.create();
  }

  @Get(':id/enrichments')
  async listEnrichments(@Param('id', ParseUUIDPipe) id: string): Promise<EnrichmentResponse[]> {
    await this.leadPublicApi.getLeadOrThrow(id);
    const enrichments = await this.enrichmentService.listByLeadId(id);
    return enrichments.map(EnrichmentResponse.fromDomain);
  }
}
