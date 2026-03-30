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
  Res,
} from '@nestjs/common';
import { LeadService } from '../../core/service/lead.service';
import { LeadExportService } from '../../core/service/lead-export.service';
import { CreateLeadDto } from '../dto/create.lead.dto';
import { UpdateLeadDto } from '../dto/update.lead.dto';
import { ExportLeadsQueryDto } from '../dto/export-leads.query.dto';
import { LeadResponse } from '../response/lead.response';
import { LeadListResponse } from '../response/lead-list.response';
import { PageQueryDto } from '@modules/shared/http/dto/page.query.dto';

@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadExportService: LeadExportService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createLeadDto: CreateLeadDto): Promise<LeadResponse> {
    const lead = await this.leadService.create(createLeadDto);
    return LeadResponse.fromDomain(lead);
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

  @Get('export')
  async export(
    @Query() query: ExportLeadsQueryDto,
    @Res() res: any,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="leads-export.csv"',
    );

    await this.leadExportService.stream(query.status, res);
    res.end();
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
}
