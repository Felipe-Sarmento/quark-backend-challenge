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
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PageQueryDto } from '@modules/shared';
import { LeadService } from '../../core/service/lead.service';
import { CreateLeadDto } from '../dto/create.lead.dto';
import { UpdateLeadDto } from '../dto/update.lead.dto';
import { LeadResponse } from '../response/lead.response';
import { LeadListResponse } from '../response/lead-list.response';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLeadDto: CreateLeadDto): Promise<LeadResponse> {
    try {
      const lead = await this.leadService.create(createLeadDto);
      return new LeadResponse(lead);
    } catch (error: unknown) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } };
      // Prisma unique constraint error (P2002)
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0] || 'field';
        throw new ConflictException(`${field} already exists`);
      }
      throw error;
    }
  }

  @Get()
  async list(@Query() query: PageQueryDto): Promise<LeadListResponse> {
    const page = query.toPage();
    const { leads, totalItems } = await this.leadService.list(page);
    const enrichedPage = page.withTotals(totalItems);
    return new LeadListResponse(
      leads.map((lead) => new LeadResponse(lead)),
      enrichedPage,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<LeadResponse> {
    const lead = await this.leadService.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    return new LeadResponse(lead);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ): Promise<LeadResponse> {
    try {
      const lead = await this.leadService.update(id, updateLeadDto);
      return new LeadResponse(lead);
    } catch (error: unknown) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } };
      // Prisma record not found error (P2025)
      if (prismaError.code === 'P2025') {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }
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
    try {
      await this.leadService.delete(id);
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      // Prisma record not found error (P2025)
      if (prismaError.code === 'P2025') {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }
      throw error;
    }
  }
}
