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
  ConflictException,
} from '@nestjs/common';
import { PageQueryDto } from '@modules/shared';
import { LeadService } from '../../core/service/lead.service';
import { CreateLeadDto } from '../dto/create.lead.dto';
import { UpdateLeadDto } from '../dto/update.lead.dto';
import { LeadResponse } from '../response/lead.response';
import { LeadListResponse } from '../response/lead-list.response';
import { CreateLeadResponse } from '../response/create-lead.response';
import { EnrichmentJobQueueProducer } from '../../queue/producer/enrichment-job.queue-producer';
import { ClassificationJobQueueProducer } from '../../queue/producer/classification-job.queue-producer';

@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly enrichmentJobQueueProducer: EnrichmentJobQueueProducer,
    private readonly classificationJobQueueProducer: ClassificationJobQueueProducer,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createLeadDto: CreateLeadDto): Promise<CreateLeadResponse> {
    const lead = await this.leadService.create(createLeadDto);

    if (lead) {
      await this.enrichmentJobQueueProducer.triggerEnrichment({
        leadId: lead.id,
        email: lead.email,
        companyName: lead.companyName,
        companyCnpj: lead.companyCnpj,
        companyWebsite: lead.companyWebsite,
      });

      await this.classificationJobQueueProducer.triggerClassification({
        leadId: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        companyName: lead.companyName,
        companyCnpj: lead.companyCnpj,
        estimatedValue: lead.estimatedValue,
        notes: lead.notes,
      });
    }

    return new CreateLeadResponse();
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
    try {
      const lead = await this.leadService.update(id, updateLeadDto);
      return LeadResponse.fromDomain(lead);
    } catch (error: unknown) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } };
      // Unique constraint error
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0] || 'field';
        throw new ConflictException(`${field} already exists`);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.leadService.delete(id);
  }
}
