import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LeadService } from '../../core/service/lead.service';
import { CreateLeadDto } from '../dto/create.lead.dto';
import { UpdateLeadDto } from '../dto/update.lead.dto';
import { LeadResponse } from '../response/lead.response';
import { LeadListResponse } from '../response/lead-list.response';
import { CreateLeadResponse } from '../response/create-lead.response';
import { LeadEnrichmentReceivedResponse } from '../response/lead-enrichment-received.response';
import { PageQueryDto } from '@modules/shared/http/dto/page.query.dto';
import { EnrichmentJobQueueProducer } from '../../queue/producer/enrichment-job.queue-producer';

@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly enrichmentJobQueueProducer: EnrichmentJobQueueProducer,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createLeadDto: CreateLeadDto): Promise<CreateLeadResponse> {
    await this.leadService.create(createLeadDto);
    return CreateLeadResponse.create();
  }

  @Get()
  async list(@Query() query: PageQueryDto): Promise<LeadListResponse> {
    const page = query.toPage();
    const { leads, totalItems } = await this.leadService.list(page);
    const enrichedPage = page.withTotals(totalItems);
    return new LeadListResponse(
      leads.map((lead) => LeadResponse.fromDomain(lead)),
      enrichedPage,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<LeadResponse> {
    const lead = await this.leadService.findById(id);
    return LeadResponse.fromDomain(lead);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ): Promise<LeadResponse> {
    const lead = await this.leadService.update(id, updateLeadDto);
    return LeadResponse.fromDomain(lead);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.leadService.delete(id);
  }

  @Post(':id/enrichment')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerEnrichment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LeadEnrichmentReceivedResponse> {
    await this.leadService.findById(id);
    await this.enrichmentJobQueueProducer.triggerEnrichment({ leadId: id });
    return LeadEnrichmentReceivedResponse.create();
  }

  @Get(':id/enrichments')
  async listEnrichments(@Param('id') _id: string): Promise<never> {
    throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
